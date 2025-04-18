// app/admin/(detail)/events/[eventId]/manage-athletes/actions.ts
'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import type { Division } from '@/lib/data';

// Define expected structure for an athlete parsed from CSV
const AthleteCsvSchema = z.object({
    last_name: z.string().min(1, "Last name is required"),
    first_name: z.string().min(1, "First name is required"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid date." }),
    gender: z.string().min(1),
    nationality: z.string().length(3, "Nationality must be 3 letters").toUpperCase().nullable().optional(),
    stance: z.enum(['Regular', 'Goofy', '']).nullable().optional(),
    fis_num: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val),
        z.union([ z.string().regex(/^\d{7}$/, "FIS number must be 7 digits"), z.literal('') ])
    ).nullable().optional(),
});

// Type inferred from schema
type AthleteCsvData = z.infer<typeof AthleteCsvSchema>;

// Define structure for checking athletes against DB
interface CheckedAthlete extends Omit<AthleteCsvData, 'stance'> { 
    csvIndex: number;
    status: 'matched' | 'new' | 'error';
    dbAthleteId?: number | null;
    validationError?: string;
    dbDetails?: { first_name: string; last_name: string; dob: Date };
    stance?: "" | "Regular" | "Goofy" | string | null; // Allow empty string or null for stance
}

// Define structure for the combined result of checking athletes and divisions
interface CheckAthletesResult {
    athletes: CheckedAthlete[];
    divisions: Division[];
}

// Define structure for final submission from client
interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    last_name?: string; first_name?: string; dob?: string; gender?: string;
    nationality?: string | null; stance?: string | null; fis_num?: string | null;
    dbAthleteId?: number | null;
}

// ---- Server Action 1: Check Athletes Against DB & Handle Divisions ----
export async function checkAthletesAgainstDb(
    eventId: number,
    parsedAthletes: unknown[]
): Promise<{ success: boolean; data?: CheckAthletesResult; error?: string }> {

    // --- Authorization Check ---
    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };
    const allowedCheckRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedCheckRoles.includes(user.roleName)) {
         return { success: false, error: "Permission denied to check athletes." };
    }
    // --- End Auth Check ---

    console.log(`Server Action: checkAthletesAgainstDb by ${user.email} for event ${eventId}`);
    if (isNaN(eventId)) return { success: false, error: "Invalid Event ID provided." };

    const pool = getDbPool();
    let client: PoolClient | null = null;
    const results: CheckedAthlete[] = [];
    const fisNumsToCheck: string[] = [];
    const nameDobToCheck: { first_name: string; last_name: string; dob: string }[] = [];
    const validatedGenders = new Set<string>();

    // 1. Validate and prepare data
    for (let i = 0; i < parsedAthletes.length; i++) {
        const rawAthlete = parsedAthletes[i];
        const parseResult = AthleteCsvSchema.safeParse(rawAthlete);

        if (!parseResult.success) {
            console.warn(`Validation failed for CSV row ${i}:`, parseResult.error.flatten().fieldErrors);
            // Cast rawAthlete to a simple record type to access properties
            const rawData = rawAthlete as Record<string, unknown>;
            results.push({
                // Explicitly access properties with type checks/defaults
                last_name: typeof rawData?.last_name === 'string' ? rawData.last_name : '',
                first_name: typeof rawData?.first_name === 'string' ? rawData.first_name : '',
                dob: typeof rawData?.dob === 'string' ? rawData.dob : '', // Keep as string for error display
                gender: typeof rawData?.gender === 'string' ? rawData.gender : '',
                nationality: typeof rawData?.nationality === 'string' ? rawData.nationality : null,
                stance: typeof rawData?.stance === 'string' ? rawData.stance : null,
                fis_num: typeof rawData?.fis_num === 'string' ? rawData.fis_num : null,
                // Add the error-specific fields
                csvIndex: i,
                status: 'error',
                validationError: parseResult.error.flatten().fieldErrors ? JSON.stringify(parseResult.error.flatten().fieldErrors) : "Invalid data format",
            });
            continue;
        }
        const validatedAthlete = parseResult.data;
        if (validatedAthlete.nationality === '') validatedAthlete.nationality = null;
        if (validatedAthlete.stance === '') validatedAthlete.stance = null;
        if (validatedAthlete.fis_num === '') validatedAthlete.fis_num = null;
        results.push({ ...validatedAthlete, csvIndex: i, status: 'new' });
        if (validatedAthlete.gender) validatedGenders.add(validatedAthlete.gender.trim().toUpperCase());
        if (validatedAthlete.fis_num) {
             fisNumsToCheck.push(validatedAthlete.fis_num);
        } else {
             nameDobToCheck.push({ first_name: validatedAthlete.first_name, last_name: validatedAthlete.last_name, dob: validatedAthlete.dob });
        }
    }
    // Return early if no valid data, include empty divisions array
    if (!results.some(r => r.status !== 'error')) {
         return { success: true, data: { athletes: results, divisions: [] }, error: "No valid athlete data found in the file." };
     }


    // 2. Handle Divisions & Perform DB Checks within a Transaction
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 2a. Check for existing linked divisions
        const getLinkedDivisionsQuery = `
            SELECT d.division_id, d.division_name FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id
            WHERE ed.event_id = $1 ORDER BY d.division_name ASC`;
        let eventDivisionsResult = await client.query<Division>(getLinkedDivisionsQuery, [eventId]);
        let divisions: Division[] = eventDivisionsResult.rows;

        // 2b. If none linked, try to create/link standard 'MEN'/'WOMEN'
        if (divisions.length === 0 && validatedGenders.size > 0) {
            console.log("No existing divisions found for event. Attempting to link standard divisions based on genders:", Array.from(validatedGenders));
            const requiredDivisionNames = new Set<string>();
            validatedGenders.forEach(gender => {
                if (['M', 'MALE', 'MEN'].includes(gender)) requiredDivisionNames.add('MEN');
                else if (['F', 'FEMALE', 'WOMEN', 'W'].includes(gender)) requiredDivisionNames.add('WOMEN');
            });
            const namesArray = Array.from(requiredDivisionNames);

            if (namesArray.length > 0) {
                console.log("Looking for base division IDs for names:", namesArray);
                const findBaseDivisionsQuery = `SELECT division_id, division_name FROM ss_division WHERE division_name = ANY($1::text[])`;
                const baseDivisionsResult = await client.query<{ division_id: number; division_name: string }>(findBaseDivisionsQuery, [namesArray]);
                const foundDivisionIds = baseDivisionsResult.rows.map(r => r.division_id);

                if (foundDivisionIds.length !== requiredDivisionNames.size) {
                     const missingNames = namesArray.filter(name => !baseDivisionsResult.rows.some(r => r.division_name === name));
                     await client.query('ROLLBACK');
                     console.error(`Missing required base divisions in 'ss_division': ${missingNames.join(', ')}`);
                     return { success: false, data: { athletes: results, divisions: [] }, error: `Setup Error: Required base divisions (${missingNames.join(', ')}) not found.` };
                }
                if (foundDivisionIds.length > 0) {
                    const linkPlaceholders = foundDivisionIds.map((_, i) => `($1, $${i + 2})`).join(',');
                    const linkDivisionQuery = `INSERT INTO ss_event_divisions (event_id, division_id) VALUES ${linkPlaceholders} ON CONFLICT DO NOTHING;`;
                    await client.query(linkDivisionQuery, [eventId, ...foundDivisionIds]);
                    eventDivisionsResult = await client.query<Division>(getLinkedDivisionsQuery, [eventId]);
                    divisions = eventDivisionsResult.rows;
                }
            }
        }

        // 2c. Perform Athlete DB Checks (FIS & Name/DOB)
        let matchedByFis: { athlete_id: number; fis_num: string; first_name: string; last_name: string; dob: Date }[] = [];
        if (fisNumsToCheck.length > 0) {
            const fisCheckQuery = `SELECT athlete_id, fis_num, first_name, last_name, dob FROM ss_athletes WHERE fis_num = ANY($1::text[])`;
            matchedByFis = (await client.query(fisCheckQuery, [fisNumsToCheck])).rows;
        }
        let matchedByNameDob: { athlete_id: number; first_name: string; last_name: string; dob: string, db_dob: Date }[] = [];
         if (nameDobToCheck.length > 0) {
            const conditions = nameDobToCheck.map((_, index) => `(LOWER(first_name)=LOWER($${index*3+1}) AND LOWER(last_name)=LOWER($${index*3+2}) AND dob=$${index*3+3}::date)`).join(' OR ');
            const values = nameDobToCheck.flatMap(a => [a.first_name, a.last_name, a.dob]);
            if (conditions) {
                 const nameDobQuery = `SELECT athlete_id, first_name, last_name, dob as db_dob FROM ss_athletes WHERE ${conditions}`;
                 matchedByNameDob = (await client.query(nameDobQuery, values)).rows.map(row => ({...row, dob: row.db_dob.toISOString().split('T')[0]}));
            }
         }

        // 3. Update status in results array
        for (const athleteResult of results) {
            if (athleteResult.status === 'error') continue;
            if (athleteResult.fis_num) {
                const fisMatch = matchedByFis.find(db => db.fis_num === athleteResult.fis_num);
                if (fisMatch) { athleteResult.status = 'matched'; athleteResult.dbAthleteId = fisMatch.athlete_id; athleteResult.dbDetails = { first_name: fisMatch.first_name, last_name: fisMatch.last_name, dob: fisMatch.dob }; }
            } else {
                const nameDobMatch = matchedByNameDob.find(db => db.first_name.toLowerCase()===athleteResult.first_name.toLowerCase() && db.last_name.toLowerCase()===athleteResult.last_name.toLowerCase() && db.dob===athleteResult.dob);
                if (nameDobMatch) { athleteResult.status = 'matched'; athleteResult.dbAthleteId = nameDobMatch.athlete_id; athleteResult.dbDetails = { first_name: nameDobMatch.first_name, last_name: nameDobMatch.last_name, dob: nameDobMatch.db_dob }; }
            }
        }

        await client.query('COMMIT');
        console.log("Transaction committed for checkAthletesAgainstDb.");
        return { success: true, data: { athletes: results, divisions: divisions } };

    } catch (error: unknown) { // Use unknown type for error
        await client?.query('ROLLBACK');
        console.error("Error checking athletes/divisions:", error);
        // Use type guard before accessing properties
        const message = error instanceof Error ? error.message : "An unknown database error occurred.";
        // Return empty divisions array on error
        return { success: false, data: { athletes: results, divisions: [] }, error: `Database error: ${message}` };
    } finally {
        if (client) client.release();
    }
}

// ---- Server Action 2: Add/Register Athletes ----
export async function addAndRegisterAthletes(
    eventId: number,
    divisionId: number,
    athletesToProcess: AthleteToRegister[]
): Promise<{ success: boolean; error?: string; registeredCount?: number }> {

     // --- Authorization Check ---
     const user = await getAuthenticatedUserWithRole();
     if (!user) return { success: false, error: "Authentication required." };
     const allowedRegisterRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
     if (!allowedRegisterRoles.includes(user.roleName)) {
         return { success: false, error: "Permission denied to register athletes." };
     }
     // --- End Auth Check ---

    console.log(`Server Action: addAndRegisterAthletes by ${user.email} for event ${eventId}, division ${divisionId}`);
    if (!eventId || typeof divisionId !== 'number' || isNaN(divisionId) || !athletesToProcess || athletesToProcess.length === 0) {
        return { success: false, error: "Missing or invalid event ID, division ID, or athlete data." };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    let registeredCount = 0;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const athleteIdsToRegister: number[] = [];

        // 1. Insert NEW athletes
        const newAthletes = athletesToProcess.filter(a => a.status === 'new');
        console.log(`Attempting to insert ${newAthletes.length} new athletes.`);
        for (const athlete of newAthletes) {
            if (!athlete.first_name || !athlete.last_name || !athlete.dob || !athlete.gender) {
                await client.query('ROLLBACK');
                 console.error(`Missing required data for new athlete at CSV index ${athlete.csvIndex}`, athlete);
                return { success: false, error: `Missing required data for new athlete at CSV index ${athlete.csvIndex}. Edit or deselect.` };
            }
            const insertQuery = `INSERT INTO ss_athletes (first_name, last_name, dob, gender, nationality, stance, fis_num) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (fis_num) WHERE fis_num IS NOT NULL DO NOTHING RETURNING athlete_id;`;
            const stance = athlete.stance === '' ? null : athlete.stance;
            const nationality = athlete.nationality === '' ? null : athlete.nationality;
            const fis_num = athlete.fis_num === '' ? null : athlete.fis_num;
            const res = await client.query(insertQuery, [athlete.first_name, athlete.last_name, athlete.dob, athlete.gender, nationality, stance, fis_num]);
            if (res.rows.length > 0) {
                athleteIdsToRegister.push(res.rows[0].athlete_id);
            } else if (fis_num) {
                 const findRes = await client.query('SELECT athlete_id FROM ss_athletes WHERE fis_num = $1', [fis_num]);
                 if (findRes.rows.length > 0) { athleteIdsToRegister.push(findRes.rows[0].athlete_id); }
                 else { console.warn(`New athlete ${athlete.first_name} with FIS# ${fis_num} conflict but not found.`); }
            } else { console.warn(`Failed to get ID for new athlete ${athlete.first_name} (no FIS#).`); }
        }

        // 2. Add MATCHED athlete IDs
        const matchedAthleteIds = athletesToProcess.filter(a => a.status==='matched' && typeof a.dbAthleteId==='number').map(a => a.dbAthleteId as number);
        athleteIdsToRegister.push(...matchedAthleteIds);

        // 3. Insert into ss_event_registrations
        const uniqueAthleteIdsToRegister = Array.from(new Set(athleteIdsToRegister.filter(id => typeof id === 'number')));
        console.log(`Attempting to register ${uniqueAthleteIdsToRegister.length} unique athletes into division ${divisionId}.`);
        if (uniqueAthleteIdsToRegister.length > 0) {
             const registrationQuery = `INSERT INTO ss_event_registrations (event_id, athlete_id, division_id) SELECT $1, athlete_id, $2 FROM unnest($3::int[]) AS athlete_id ON CONFLICT (event_id, athlete_id) DO NOTHING;`;
             const regRes = await client.query(registrationQuery, [eventId, divisionId, uniqueAthleteIdsToRegister]);
             registeredCount = regRes.rowCount ?? 0;
             console.log(`Inserted ${registeredCount} new registrations.`);
        } else { console.log("No unique, valid athlete IDs identified."); }

        await client.query('COMMIT');
        console.log("Transaction committed.");
        revalidatePath(`/admin/events/${eventId}`);
        revalidatePath(`/admin/events/${eventId}/manage-athletes`);
        return { success: true, registeredCount };

    } catch (error: unknown) { // Use unknown type
        await client?.query('ROLLBACK');
        console.error("Error processing athlete registration:", error);
        // Use type guard
        const message = error instanceof Error ? error.message : "An unknown error occurred during registration.";
        return { success: false, error: `Registration failed: ${message}` };
    } finally {
        if (client) client.release();
    }
}

// --- Action to get divisions ---
export async function getEventDivisions(eventId: number): Promise<{ success: boolean; data?: Division[]; error?: string }> {
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
    } catch (error: unknown) { // Use unknown type
        console.error("Error fetching event divisions:", error);
        // Use type guard
        const message = error instanceof Error ? error.message : "An unknown database error occurred.";
        return { success: false, error: `Failed to fetch event divisions: ${message}` };
    } finally {
        if (client) client.release();
    }
}