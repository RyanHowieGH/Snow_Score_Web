'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import type { Division } from '@/lib/data';

// --- Zod Schema for CSV Athlete Data ---
const AthleteCsvSchema = z.object({
    last_name: z.string().min(1, "Last name is required"),
    first_name: z.string().min(1, "First name is required"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid date." }),
    gender: z.string().min(1, "Gender is required."),
    nationality: z.string().length(3, "Nationality must be 3 letters").toUpperCase().nullable().optional().transform(val => val === '' ? null : val),
    stance: z.enum(['Regular', 'Goofy', '']).nullable().optional().transform(val => val === '' ? null : val),
    fis_num: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val),
        z.union([z.string().regex(/^\d{7}$/, "FIS number must be 7 digits"), z.literal('')])
    ).nullable().optional().transform(val => val === '' ? null : val),
});
type AthleteCsvData = z.infer<typeof AthleteCsvSchema>;

// --- Interface for Athlete Data during Checking Phase ---
interface CheckedAthlete extends AthleteCsvData {
    csvIndex: number;
    status: 'matched' | 'new' | 'error';
    dbAthleteId?: number | null;
    validationError?: string;
    dbDetails?: { first_name: string; last_name: string; dob: Date };
    suggested_division_id?: number | null;
    suggested_division_name?: string | null;
}

// --- Interface for Result of checkAthletesAgainstDb ---
interface CheckAthletesResult {
    athletes: CheckedAthlete[];
    divisions: Division[];
}

// --- Interface for Athlete Data during Registration Submission ---
interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    division_id: number;
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: string | null;
    dbAthleteId?: number | null;
}


// ---- SERVER ACTION 1: Check Athletes Against DB & Handle Divisions ----
export async function checkAthletesAgainstDb(
    eventId: number,
    parsedAthletesFromCsv: unknown[]
): Promise<{ success: boolean; data?: CheckAthletesResult; error?: string }> {

    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };
    const allowedCheckRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedCheckRoles.includes(user.roleName)) {
        return { success: false, error: "Permission denied to check athletes." };
    }

    console.log(`Server Action: checkAthletesAgainstDb by ${user.email} for event ${eventId}`);
    if (isNaN(eventId)) return { success: false, error: "Invalid Event ID provided." };

    const pool = getDbPool();
    let client: PoolClient | null = null;
    const checkedAthletesResult: CheckedAthlete[] = [];
    const fisNumStringsFromCsv: string[] = [];
    const nameDobToCheck: { first_name: string; last_name: string; dob: string }[] = [];
    const validatedGenders = new Set<string>();

    // 1. Validate CSV data and prepare for DB checks
    for (let i = 0; i < parsedAthletesFromCsv.length; i++) {
        const rawAthlete = parsedAthletesFromCsv[i];
        const parseResult = AthleteCsvSchema.safeParse(rawAthlete);

        if (!parseResult.success) {
            console.warn(`Validation failed for CSV row ${i + 2}:`, parseResult.error.flatten().fieldErrors);
            const rawData = rawAthlete as Record<string, unknown>;
            let stanceForErrorRow: "Regular" | "Goofy" | null = null;
            if (typeof rawData?.stance === 'string') {
                if (rawData.stance === 'Regular') stanceForErrorRow = 'Regular';
                else if (rawData.stance === 'Goofy') stanceForErrorRow = 'Goofy';
            }
            checkedAthletesResult.push({
                last_name: typeof rawData?.last_name === 'string' ? rawData.last_name : '',
                first_name: typeof rawData?.first_name === 'string' ? rawData.first_name : '',
                dob: typeof rawData?.dob === 'string' ? rawData.dob : 'N/A',
                gender: typeof rawData?.gender === 'string' ? rawData.gender : 'N/A',
                nationality: typeof rawData?.nationality === 'string' ? rawData.nationality : null,
                stance: stanceForErrorRow,
                fis_num: typeof rawData?.fis_num === 'string' ? rawData.fis_num : null,
                csvIndex: i,
                status: 'error',
                validationError: JSON.stringify(parseResult.error.flatten().fieldErrors),
            });
            continue;
        }
        const validatedAthlete = parseResult.data;
        checkedAthletesResult.push({ ...validatedAthlete, csvIndex: i, status: 'new' });

        if (validatedAthlete.gender) validatedGenders.add(validatedAthlete.gender.trim().toUpperCase());
        if (validatedAthlete.fis_num) {
             fisNumStringsFromCsv.push(validatedAthlete.fis_num);
        } else {
             nameDobToCheck.push({ first_name: validatedAthlete.first_name, last_name: validatedAthlete.last_name, dob: validatedAthlete.dob });
        }
    }

    let eventDivisions: Division[] = [];

    if (!checkedAthletesResult.some(r => r.status !== 'error')) {
         return { success: true, data: { athletes: checkedAthletesResult, divisions: [] }, error: "No valid athlete data found in the file." };
    }

    const numericFisNumsToQuery: number[] = fisNumStringsFromCsv
        .map(fisStr => parseInt(fisStr, 10))
        .filter(fisNum => !isNaN(fisNum));

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const getLinkedDivisionsQuery = `
            SELECT d.division_id, d.division_name FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id
            WHERE ed.event_id = $1 ORDER BY d.division_name ASC`;
        const initialEventDivisionsResult = await client.query<Division>(getLinkedDivisionsQuery, [eventId]);
        eventDivisions = initialEventDivisionsResult.rows;
        // VVV --- ADDED LOGGING --- VVV
        console.log(`Initial event divisions for event ${eventId}:`, JSON.stringify(eventDivisions, null, 2));
        // ^^^ --- ADDED LOGGING --- ^^^

        if (eventDivisions.length === 0 && validatedGenders.size > 0) {
            console.log("No existing divisions found for event. Attempting to link standard divisions based on genders:", Array.from(validatedGenders));
            const requiredDivisionNames = new Set<string>();
            validatedGenders.forEach(gender => {
                if (['M', 'MALE', 'MEN'].includes(gender)) requiredDivisionNames.add('MEN');
                else if (['F', 'FEMALE', 'WOMEN', 'W'].includes(gender)) requiredDivisionNames.add('WOMEN');
            });
            const namesArray = Array.from(requiredDivisionNames);

            if (namesArray.length > 0) {
                const findBaseDivisionsQuery = `SELECT division_id, division_name FROM ss_division WHERE division_name = ANY($1::text[])`;
                const baseDivisionsResult = await client.query<{ division_id: number; division_name: string }>(findBaseDivisionsQuery, [namesArray]);
                const foundDivisionsFromDb = baseDivisionsResult.rows;

                if (foundDivisionsFromDb.length !== requiredDivisionNames.size) {
                     const missingNames = namesArray.filter(name => !foundDivisionsFromDb.some(r => r.division_name === name));
                     await client.query('ROLLBACK');
                     return { success: false, data: { athletes: checkedAthletesResult, divisions: [] }, error: `Setup Error: Required base divisions (${missingNames.join(', ')}) not found.` };
                }
                if (foundDivisionsFromDb.length > 0) {
                    const foundDivisionIds = foundDivisionsFromDb.map(d => d.division_id);
                    const linkPlaceholders = foundDivisionIds.map((_, i) => `($1, $${i + 2})`).join(',');
                    const linkDivisionQuery = `INSERT INTO ss_event_divisions (event_id, division_id) VALUES ${linkPlaceholders} ON CONFLICT DO NOTHING;`;
                    await client.query(linkDivisionQuery, [eventId, ...foundDivisionIds]);
                    const updatedEventDivisionsResult = await client.query<Division>(getLinkedDivisionsQuery, [eventId]);
                    eventDivisions = updatedEventDivisionsResult.rows;
                    // VVV --- ADDED LOGGING --- VVV
                    console.log(`Event divisions after attempting to link standard for event ${eventId}:`, JSON.stringify(eventDivisions, null, 2));
                    // ^^^ --- ADDED LOGGING --- ^^^
                }
            }
        }

        let matchedByFis: { athlete_id: number; fis_num: number; first_name: string; last_name: string; dob: Date }[] = [];
        if (numericFisNumsToQuery.length > 0) {
            const fisCheckQuery = `SELECT athlete_id, fis_num, first_name, last_name, dob FROM ss_athletes WHERE fis_num = ANY($1)`;
            matchedByFis = (await client.query<{ athlete_id: number; fis_num: number; first_name: string; last_name: string; dob: Date }>(
                fisCheckQuery, [numericFisNumsToQuery]
            )).rows;
        }

        let matchedByNameDob: { athlete_id: number; first_name: string; last_name: string; dob: string; db_dob: Date }[] = [];
        if (nameDobToCheck.length > 0) {
            const conditions = nameDobToCheck.map((_, index) => `(LOWER(first_name)=LOWER($${index*3+1}) AND LOWER(last_name)=LOWER($${index*3+2}) AND dob=$${index*3+3}::date)`).join(' OR ');
            const values = nameDobToCheck.flatMap(a => [a.first_name, a.last_name, a.dob]);
            if (conditions) {
                 const nameDobQuery = `SELECT athlete_id, first_name, last_name, dob as db_dob FROM ss_athletes WHERE ${conditions}`;
                 matchedByNameDob = (await client.query(nameDobQuery, values)).rows.map(row => ({ ...row, dob: row.db_dob.toISOString().split('T')[0] }));
            }
        }

        for (const athlete of checkedAthletesResult) {
            if (athlete.status === 'error') continue;
            let matchFound = false;
            if (athlete.fis_num) {
                const csvFisNumAsInt = parseInt(athlete.fis_num, 10);
                if (!isNaN(csvFisNumAsInt)) {
                    const fisMatch = matchedByFis.find(db => db.fis_num === csvFisNumAsInt);
                    if (fisMatch) {
                        athlete.status = 'matched'; athlete.dbAthleteId = fisMatch.athlete_id;
                        athlete.dbDetails = { first_name: fisMatch.first_name, last_name: fisMatch.last_name, dob: fisMatch.dob };
                        matchFound = true;
                    }
                }
            }
            if (!matchFound && !athlete.fis_num) {
                const nameDobMatch = matchedByNameDob.find(db =>
                    db.first_name.toLowerCase() === athlete.first_name.toLowerCase() &&
                    db.last_name.toLowerCase() === athlete.last_name.toLowerCase() &&
                    db.dob === athlete.dob
                );
                if (nameDobMatch) {
                    athlete.status = 'matched'; athlete.dbAthleteId = nameDobMatch.athlete_id;
                    athlete.dbDetails = { first_name: nameDobMatch.first_name, last_name: nameDobMatch.last_name, dob: nameDobMatch.db_dob };
                }
            }

            // Suggest division based on gender
            if (athlete.gender && eventDivisions.length > 0) {
                const genderUpper = athlete.gender.trim().toUpperCase();
                let foundDivision: Division | undefined = undefined; // Use the Division type

                console.log(`Athlete: ${athlete.first_name} ${athlete.last_name}, Gender: ${athlete.gender} (Processed: ${genderUpper})`);
                console.log(`  Available event divisions for matching: ${JSON.stringify(eventDivisions.map(d => d.division_name))}`);


                if (['M', 'MALE', 'MEN'].includes(genderUpper)) {
                    // Try to find "MALE" first, then "MEN" if "MALE" isn't linked to the event
                    foundDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'MALE');
                    if (!foundDivision) {
                        foundDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'MEN');
                    }
                } else if (['F', 'FEMALE', 'WOMEN', 'W'].includes(genderUpper)) {
                    // Try to find "FEMALE" first, then "WOMEN"
                    foundDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'FEMALE');
                    if (!foundDivision) {
                        foundDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'WOMEN');
                    }
                }

                if (foundDivision) {
                    athlete.suggested_division_id = foundDivision.division_id;
                    athlete.suggested_division_name = foundDivision.division_name; // Use the actual name from DB
                    console.log(`  SUGGESTED: ID=${foundDivision.division_id}, Name=${foundDivision.division_name}`);
                } else {
                    console.log(`  NO SUGGESTION: No suitable division (Male/Men or Female/Women) found in this event's linked divisions for gender '${genderUpper}'.`);
                }
            } else if (!athlete.gender) {
                console.log(`Athlete: ${athlete.first_name} ${athlete.last_name} - No gender provided, cannot suggest division.`);
            } else if (eventDivisions.length === 0) {
                console.log(`Athlete: ${athlete.first_name} ${athlete.last_name} - No event divisions available to suggest from (eventDivisions array is empty).`);
            }
        }
        // VVV --- ADDED LOGGING --- VVV
        console.log("Final checkedAthletesResult being sent to client:", JSON.stringify(checkedAthletesResult.filter(a => a.status !== 'error').map(a => ({name: `${a.first_name} ${a.last_name}`, gender: a.gender, sugId: a.suggested_division_id, sugName: a.suggested_division_name })), null, 2));
        // ^^^ --- ADDED LOGGING --- ^^^
        await client.query('COMMIT');
        return { success: true, data: { athletes: checkedAthletesResult, divisions: eventDivisions } };

    } catch (error: unknown) {
        await client?.query('ROLLBACK');
        console.error("Error in checkAthletesAgainstDb:", error);
        const message = error instanceof Error ? error.message : "An unknown database error occurred.";
        return { success: false, data: { athletes: checkedAthletesResult, divisions: eventDivisions || [] }, error: `Database error: ${message}` };
    } finally {
        if (client) client.release();
    }
}


// ---- SERVER ACTION 2: Add/Register Athletes ----
// (This function remains as per the previous "complete file" version)
export async function addAndRegisterAthletes(
    eventId: number,
    athletesToProcess: AthleteToRegister[]
): Promise<{ success: boolean; error?: string; registeredCount?: number, details?: {athleteName: string, status: string, error?: string}[] }> {

    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };
    const allowedRegisterRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRegisterRoles.includes(user.roleName)) {
         return { success: false, error: "Permission denied to register athletes." };
    }

    console.log(`=========================================================================`);
    console.log(`Server Action: addAndRegisterAthletes by ${user.email} for event ${eventId}`);
    console.log("Incoming athletesToProcess:", JSON.stringify(athletesToProcess, null, 2));
    console.log(`=========================================================================`);


    if (!eventId || !athletesToProcess || athletesToProcess.length === 0) {
        console.error("Validation Error: Missing eventId or athletesToProcess is empty.");
        return { success: false, error: "Missing or invalid event ID or athlete data." };
    }
    for (const athlete of athletesToProcess) {
        if (typeof athlete.division_id !== 'number' || isNaN(athlete.division_id)) {
            console.error(`Validation Error: Athlete (CSV Index: ${athlete.csvIndex}, Name: ${athlete.first_name} ${athlete.last_name}) is missing a valid division assignment. Division ID: ${athlete.division_id}`);
            return { success: false, error: `Athlete (CSV Index: ${athlete.csvIndex}, Name: ${athlete.first_name} ${athlete.last_name}) is missing a valid division assignment.` };
        }
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    let totalRegisteredCount = 0;
    const registrationDetails: {athleteName: string, status: string, error?: string}[] = [];
    const newAthleteIdByCsvIndex = new Map<number, number>();

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 1. Insert NEW athletes and capture their new IDs
        const newAthletesFromPayload = athletesToProcess.filter(a => a.status === 'new');
        if (newAthletesFromPayload.length > 0) {
            console.log(`--- Inserting/Updating ${newAthletesFromPayload.length} NEW athlete profiles ---`);
            for (const athlete of newAthletesFromPayload) {
                const athleteName = `${athlete.first_name} ${athlete.last_name}`;
                console.log(`  Processing NEW athlete (CSV Index ${athlete.csvIndex}): ${athleteName}`);
                try {
                    if (!athlete.first_name || !athlete.last_name || !athlete.dob || !athlete.gender) {
                        throw new Error(`Missing required data (name, DOB, or gender).`);
                    }
                    const fisNumForDb = athlete.fis_num ? athlete.fis_num : null;
                    console.log(`    Inserting with data:`, { ...athlete, fis_num_for_db: fisNumForDb });

                    const insertQuery = `
                        INSERT INTO ss_athletes (first_name, last_name, dob, gender, nationality, stance, fis_num)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (fis_num) WHERE fis_num IS NOT NULL DO UPDATE SET
                            first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, dob = EXCLUDED.dob,
                            gender = EXCLUDED.gender, nationality = EXCLUDED.nationality, stance = EXCLUDED.stance
                        RETURNING athlete_id;`;

                    const res = await client.query(insertQuery, [
                        athlete.first_name, athlete.last_name, athlete.dob, athlete.gender,
                        athlete.nationality, athlete.stance, fisNumForDb
                    ]);

                    if (res.rows.length > 0) {
                        const newId = res.rows[0].athlete_id;
                        newAthleteIdByCsvIndex.set(athlete.csvIndex, newId);
                        console.log(`    Athlete profile CREATED/UPDATED for ${athleteName}. New/Existing ID: ${newId}`);
                        registrationDetails.push({ athleteName, status: "Athlete Profile Created/Updated"});
                    } else if (fisNumForDb) {
                        console.log(`    Insert/Update for ${athleteName} (FIS: ${fisNumForDb}) did not return rows. Trying to find by FIS...`);
                        const findRes = await client.query('SELECT athlete_id FROM ss_athletes WHERE fis_num = $1', [fisNumForDb]);
                        if (findRes.rows.length > 0) {
                            const existingId = findRes.rows[0].athlete_id;
                            newAthleteIdByCsvIndex.set(athlete.csvIndex, existingId);
                            console.log(`    Athlete profile FOUND by FIS for ${athleteName} (post-conflict). ID: ${existingId}`);
                            registrationDetails.push({ athleteName, status: "Athlete Profile Matched by FIS (post-conflict)"});
                        } else {
                             throw new Error(`FIS conflict/insert issue but athlete not found (FIS: ${fisNumForDb}).`);
                        }
                    } else {
                        throw new Error(`Failed to get ID for new athlete (No FIS# and insert did not return ID).`);
                    }
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Unknown error creating athlete profile.";
                    console.error(`    ERROR creating profile for ${athleteName} (CSV Index: ${athlete.csvIndex}): ${message}`);
                    registrationDetails.push({ athleteName, status: "Athlete Profile Creation Failed", error: message });
                    // Continue to try others for now, registration step will filter these out if ID is not found
                }
            }
            console.log("Map of newAthleteIdByCsvIndex:", newAthleteIdByCsvIndex);
        }


        console.log(`\n--- Registering ALL selected athletes into event divisions ---`);
        for (const athlete of athletesToProcess) {
            // Determine athlete name for logging, using dbDetails if available for matched athletes
            const csvName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim();
            const athleteNameForLog = athlete.status === 'matched' && athlete.dbAthleteId ?
                `Matched Athlete (DB ID: ${athlete.dbAthleteId}, CSV: ${csvName})` :
                `New Athlete (CSV Index: ${athlete.csvIndex}, Name: ${csvName})`;

            console.log(`  Processing for registration: ${athleteNameForLog}`);
            let athleteIdToRegister: number | undefined;

            if (athlete.status === 'new') {
                athleteIdToRegister = newAthleteIdByCsvIndex.get(athlete.csvIndex);
                console.log(`    Status NEW. Retrieved ID from map: ${athleteIdToRegister} (for CSV Index ${athlete.csvIndex})`);
            } else { // status === 'matched'
                athleteIdToRegister = athlete.dbAthleteId ?? undefined;
                console.log(`    Status MATCHED. DB Athlete ID from payload: ${athleteIdToRegister}`);
            }

            console.log(`    Final Athlete ID for registration: ${athleteIdToRegister}, Target Division ID: ${athlete.division_id}`);

            if (typeof athleteIdToRegister === 'number' && typeof athlete.division_id === 'number') {
                try {
                    const registrationQuery = `
                    INSERT INTO ss_event_registrations (event_id, athlete_id, division_id)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (event_id, athlete_id) DO UPDATE SET division_id = EXCLUDED.division_id; 
                    -- Removed RETURNING registration_id
                    `;
                    const regRes = await client.query(registrationQuery, [eventId, athleteIdToRegister, athlete.division_id]);

                    console.log(`    Registration query for Athlete ID ${athleteIdToRegister}, Division ID ${athlete.division_id}: rowCount=${regRes.rowCount}`);

                if (regRes.rowCount && regRes.rowCount > 0) { // Check rowCount
                    totalRegisteredCount++;
                        console.log(`      SUCCESSFULLY registered/updated division for Athlete ID ${athleteIdToRegister} into Division ID ${athlete.division_id}.`);
                        registrationDetails.push({ athleteName: csvName || `Athlete ID ${athleteIdToRegister}`, status: `Registered/Updated in Division ID ${athlete.division_id}`});
                    } else {
                        // This means ON CONFLICT happened and DO UPDATE resulted in no change (same division_id)
                        // OR if you used DO NOTHING and it was a conflict.
                        console.log(`      Athlete ID ${athleteIdToRegister} already registered in Division ID ${athlete.division_id} or no change made.`);
                        registrationDetails.push({ athleteName: csvName || `Athlete ID ${athleteIdToRegister}`, status: `Already Registered / No Change in Division ID ${athlete.division_id}`});
                    }
                } catch (regErr) {
                    const message = regErr instanceof Error ? regErr.message : "Unknown registration error.";
                    console.error(`    ERROR registering ${athleteNameForLog} (Athlete ID: ${athleteIdToRegister}) into division ${athlete.division_id}: ${message}`);
                    registrationDetails.push({ athleteName: csvName || `Athlete ID ${athleteIdToRegister}`, status: "Registration Failed", error: message });
                }
            } else {
                console.warn(`    SKIPPED registration for ${athleteNameForLog}: Missing valid athleteIdToRegister (${athleteIdToRegister}) or division_id (${athlete.division_id}).`);
                const errorReason = typeof athleteIdToRegister !== 'number' ? "missing/invalid athlete ID" : "missing/invalid division ID";
                registrationDetails.push({ athleteName: csvName || `Athlete CSV Index ${athlete.csvIndex}`, status: "Registration Skipped", error: errorReason });
            }
        }

        await client.query('COMMIT');
        console.log("Transaction committed for addAndRegisterAthletes. Total registered/updated count:", totalRegisteredCount);
        revalidatePath(`/admin/events/${eventId}/manage-athletes`);
        revalidatePath(`/admin/events/${eventId}`);

        return { success: true, registeredCount: totalRegisteredCount, details: registrationDetails };

    } catch (error: unknown) {
        if (client) await client.query('ROLLBACK'); // Ensure rollback if client exists
        console.error("Critical error in addAndRegisterAthletes transaction:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred during registration process.";
        return { success: false, error: `Registration process failed: ${message}`, details: registrationDetails };
    } finally {
        if (client) client.release();
    }
}


// --- Action to get divisions for the event ---
export async function getEventDivisions(eventId: number): Promise<{ success: boolean; data?: Division[]; error?: string }> {
    // ... (this function remains the same)
    console.log(`Server Action: getEventDivisions called for event ${eventId}`);
    if (isNaN(eventId)) return { success: false, error: "Invalid Event ID provided." };
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const divisionResult = await client.query<Division>(
            `SELECT d.division_id, d.division_name FROM ss_division d JOIN ss_event_divisions ed ON d.division_id = ed.division_id WHERE ed.event_id = $1 ORDER BY d.division_name ASC`,
            [eventId]
        );
        return { success: true, data: divisionResult.rows };
    } catch (error: unknown) {
        console.error("Error fetching event divisions:", error);
        const message = error instanceof Error ? error.message : "An unknown database error occurred.";
        return { success: false, error: `Failed to fetch event divisions: ${message}` };
    } finally {
        if (client) client.release();
    }
}