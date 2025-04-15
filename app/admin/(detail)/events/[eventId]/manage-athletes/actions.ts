// app/admin/events/[eventId]/manage-athletes/actions.ts
"use server"; // Mark this module as Server Actions

import { z } from 'zod'; // For data validation
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache'; // To update UI after registration

// Define Division type here (using number for the serialized ID)
export interface Division {
    division_id: number;
    division_name: string;
}

// Define expected structure for an athlete parsed from CSV
// Using zod for validation
const AthleteCsvSchema = z.object({
    last_name: z.string().min(1, "Last name is required"),
    first_name: z.string().min(1, "First name is required"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"), // Basic format check
    gender: z.string().min(1), // Ensure gender is present
    nationality: z.string().length(3, "Nationality must be 3 letters").toUpperCase().nullable().optional(),
    stance: z.enum(['Regular', 'Goofy', '']).nullable().optional(), // Allow empty string from CSV
    fis_num: z.preprocess( // Trim whitespace before validation
        (val) => (typeof val === 'string' ? val.trim() : val),
        z.union([ // Allow either 7 digits or empty string
            z.string().regex(/^\d{7}$/, "FIS number must be 7 digits"),
            z.literal('')
        ])
    ).nullable().optional(), // Still allow original null/undefined input
});

// Type inferred from zod schema
type AthleteCsvData = z.infer<typeof AthleteCsvSchema>;

// Define structure for checking athletes against DB
interface CheckedAthlete extends AthleteCsvData {
    csvIndex: number; // Original index in the parsed CSV array
    status: 'matched' | 'new' | 'error';
    dbAthleteId?: number | null; // athlete_id if matched
    validationError?: string; // Parsing/validation error message
    dbDetails?: { // Optional: show details from DB if matched
        first_name: string;
        last_name: string;
        dob: Date;
    }
}

// Define structure for the combined result of checking athletes and divisions
interface CheckAthletesResult {
    athletes: CheckedAthlete[];
    divisions: Division[]; // Uses corrected Division interface
}

// ---- Server Action 1: Check Athletes Against DB & Handle Divisions ----
export async function checkAthletesAgainstDb(
    eventId: number, // Receive eventId
    parsedAthletes: unknown[] // Receive raw parsed data
): Promise<{ success: boolean; data?: CheckAthletesResult; error?: string }> { // Updated return data structure

    console.log(`Server Action: checkAthletesAgainstDb received ${parsedAthletes.length} records for event ${eventId}`);
    if (isNaN(eventId)) {
        return { success: false, error: "Invalid Event ID provided." };
    }
    const pool = getDbPool();
    let client: PoolClient | null = null;
    const results: CheckedAthlete[] = [];
    const fisNumsToCheck: string[] = [];
    const nameDobToCheck: { first_name: string; last_name: string; dob: string }[] = [];
    let validatedGenders = new Set<string>(); // To store unique genders from valid rows

    // 1. Validate and prepare data for checking (also collect genders)
    for (let i = 0; i < parsedAthletes.length; i++) {
        const rawAthlete = parsedAthletes[i];
        const parseResult = AthleteCsvSchema.safeParse(rawAthlete);

        if (!parseResult.success) {
            console.warn(`Validation failed for CSV row ${i}:`, parseResult.error.flatten().fieldErrors);
            results.push({
                ...(rawAthlete as any), // Keep original data for display if possible
                csvIndex: i,
                status: 'error',
                validationError: parseResult.error.flatten().fieldErrors ? JSON.stringify(parseResult.error.flatten().fieldErrors) : "Invalid data format",
            });
            continue; // Skip DB check for invalid rows
        }

        const validatedAthlete = parseResult.data;
        // Clean up optional fields that might be empty strings from CSV
        if (validatedAthlete.nationality === '') validatedAthlete.nationality = null;
        if (validatedAthlete.stance === '') validatedAthlete.stance = null;
        if (validatedAthlete.fis_num === '') validatedAthlete.fis_num = null;

        results.push({ ...validatedAthlete, csvIndex: i, status: 'new' }); // Assume new initially

        // Collect gender for potential division creation
        if (validatedAthlete.gender) {
            validatedGenders.add(validatedAthlete.gender.trim().toUpperCase()); // Store normalized gender
        }

        // Prioritize checking by FIS number if available
        if (validatedAthlete.fis_num) {
            fisNumsToCheck.push(validatedAthlete.fis_num);
        } else {
            // Otherwise, prepare for Name+DOB check (less reliable)
            nameDobToCheck.push({
                first_name: validatedAthlete.first_name,
                last_name: validatedAthlete.last_name,
                dob: validatedAthlete.dob,
            });
        }
    }

    // Check if there's any valid data to process further
    if (!results.some(r => r.status !== 'error')) {
        // Return empty divisions if no valid athletes to prevent errors downsteam
        return { success: true, data: { athletes: results, divisions: [] }, error: "No valid athlete data found in the file." };
    }

    // 2. Handle Divisions & Perform DB Checks within a Transaction
    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Start transaction

        // 2a. Check for existing divisions LINKED TO THIS EVENT
        const getLinkedDivisionsQuery = `
            SELECT d.division_id, d.division_name
            FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id -- Join based on integer IDs
            WHERE ed.event_id = $1
            ORDER BY d.division_name ASC`;
        let eventDivisionsResult = await client.query<Division>(getLinkedDivisionsQuery, [eventId]);
        let divisions: Division[] = eventDivisionsResult.rows;

        // 2b. If no divisions are linked, try to link standard ones based on gender
        if (divisions.length === 0 && validatedGenders.size > 0) {
            console.log("No existing divisions found for event. Attempting to link standard divisions based on genders:", Array.from(validatedGenders));

            // --- Identify REQUIRED standard division NAMES ---
            const requiredDivisionNames = new Set<string>();
            validatedGenders.forEach(gender => {
                // Normalize common inputs to standard names 'Men' / 'Women'
                if (['M', 'MALE', 'MEN'].includes(gender)) requiredDivisionNames.add('MEN');
                else if (['F', 'FEMALE', 'WOMEN', 'W'].includes(gender)) requiredDivisionNames.add('WOMEN');
                // Add other mappings if needed (e.g., Non-Binary -> 'Non-Binary')
                // else if (['NB', 'NONBINARY', 'NON-BINARY'].includes(gender)) requiredDivisionNames.add('Non-Binary');
                else console.log(`Skipping division creation for unmapped gender: ${gender}`);
            });

            const namesArray = Array.from(requiredDivisionNames);

            if (namesArray.length > 0) {
                console.log("Looking for base division IDs for names:", namesArray);

                // --- Query ss_division to find the INTEGER IDs for these standard NAMES ---
                const findBaseDivisionsQuery = `
                    SELECT division_id, division_name
                    FROM ss_division
                    WHERE division_name = ANY($1::text[])`;
                const baseDivisionsResult = await client.query<{ division_id: number; division_name: string }>(
                    findBaseDivisionsQuery,
                    [namesArray]
                );

                const foundDivisionIds = baseDivisionsResult.rows.map(r => r.division_id);
                console.log("Found base division IDs:", foundDivisionIds);

                // Check if all required divisions were found in the base table
                 if (foundDivisionIds.length !== requiredDivisionNames.size) {
                     const foundNames = baseDivisionsResult.rows.map(r => r.division_name);
                     const missingNames = namesArray.filter(name => !foundNames.includes(name));
                     // Critical Error: Base divisions must exist in ss_division.
                      await client.query('ROLLBACK'); // Abort the transaction
                      console.error(`Missing required base divisions in 'ss_division' table: ${missingNames.join(', ')}`);
                      // Return empty divisions list in this error case
                      return { success: false, data: { athletes: results, divisions: [] }, error: `Setup Error: Required base divisions (${missingNames.join(', ')}) not found in the main division table.` };
                 }

                // --- Link these found division IDs to the current event in ss_event_divisions ---
                if (foundDivisionIds.length > 0) {
                    const linkValues = foundDivisionIds.map((id, i) => `($1, $${i + 2})`).join(',');
                    const linkDivisionQuery = `
                        INSERT INTO ss_event_divisions (event_id, division_id)
                        VALUES ${linkValues}
                        ON CONFLICT (event_id, division_id) DO NOTHING;`; // Ignore if already linked somehow
                    await client.query(linkDivisionQuery, [eventId, ...foundDivisionIds]);
                    console.log(`Linked divisions with IDs ${foundDivisionIds.join(', ')} to event ${eventId}`);

                    // Re-query to get the final list of divisions for the event including newly linked ones
                    eventDivisionsResult = await client.query<Division>(getLinkedDivisionsQuery, [eventId]);
                    divisions = eventDivisionsResult.rows;
                    console.log("Divisions after linking:", divisions);
                }
            } else {
                 console.log("No standard division names identified from CSV genders.");
                 // Even if no standard names found, proceed with athlete checks, divisions list will remain empty
            }
        }


        // 2c. Perform Athlete DB Checks (FIS & Name/DOB)
        let matchedByFis: { athlete_id: number; fis_num: string; first_name: string; last_name: string; dob: Date }[] = [];
        if (fisNumsToCheck.length > 0) {
            const fisCheckQuery = `
                SELECT athlete_id, fis_num, first_name, last_name, dob
                FROM ss_athletes
                WHERE fis_num = ANY($1::text[])`;
            const fisCheckResult = await client.query(fisCheckQuery, [fisNumsToCheck]);
            matchedByFis = fisCheckResult.rows;
            console.log("Matched by FIS:", matchedByFis.length);
        }

        let matchedByNameDob: { athlete_id: number; first_name: string; last_name: string; dob: string, db_dob: Date }[] = [];
         if (nameDobToCheck.length > 0) {
            const conditions = nameDobToCheck.map((_, index) =>
                `(LOWER(first_name) = LOWER($${index * 3 + 1}) AND LOWER(last_name) = LOWER($${index * 3 + 2}) AND dob = $${index * 3 + 3}::date)`
            ).join(' OR ');
            const values = nameDobToCheck.flatMap(a => [a.first_name, a.last_name, a.dob]);
            if (conditions) {
                 const nameDobQuery = `
                    SELECT athlete_id, first_name, last_name, dob as db_dob
                    FROM ss_athletes
                    WHERE ${conditions}`;
                const nameDobResult = await client.query(nameDobQuery, values);
                 matchedByNameDob = nameDobResult.rows.map(row => ({
                    ...row,
                    dob: row.db_dob.toISOString().split('T')[0] // Format date back to YYYY-MM-DD for comparison
                 }));
                console.log("Matched by Name+DOB:", matchedByNameDob.length);
            }
         }

        // 3. Update status in results array based on matches
        for (const athleteResult of results) {
            if (athleteResult.status === 'error') continue; // Skip errored rows

            if (athleteResult.fis_num) { // Check FIS match first if fis_num exists
                const fisMatch = matchedByFis.find(db => db.fis_num === athleteResult.fis_num);
                if (fisMatch) {
                    athleteResult.status = 'matched';
                    athleteResult.dbAthleteId = fisMatch.athlete_id;
                    athleteResult.dbDetails = { first_name: fisMatch.first_name, last_name: fisMatch.last_name, dob: fisMatch.dob };
                }
                // If fis_num exists but no match, status remains 'new'. It won't check name/dob.
            } else { // Only check Name+DOB if fis_num was NOT provided
                const nameDobMatch = matchedByNameDob.find(db =>
                    db.first_name.toLowerCase() === athleteResult.first_name.toLowerCase() &&
                    db.last_name.toLowerCase() === athleteResult.last_name.toLowerCase() &&
                    db.dob === athleteResult.dob // Compare YYYY-MM-DD strings
                );
                 if (nameDobMatch) {
                    athleteResult.status = 'matched';
                    athleteResult.dbAthleteId = nameDobMatch.athlete_id;
                    athleteResult.dbDetails = { first_name: nameDobMatch.first_name, last_name: nameDobMatch.last_name, dob: nameDobMatch.db_dob };
                }
                 // If no match found by name/dob (and no fis num), status remains 'new'.
            }
        }

        await client.query('COMMIT'); // Commit transaction
        console.log("Transaction committed for checkAthletesAgainstDb.");

        // Return athletes and the final list of event divisions (with integer IDs)
        return { success: true, data: { athletes: results, divisions: divisions } };

    } catch (error) {
        await client?.query('ROLLBACK'); // Rollback on error
        console.error("Error checking athletes/divisions:", error);
        // Return empty divisions list on error to prevent downstream issues
        return { success: false, data: { athletes: results, divisions: [] }, error: "Failed during athlete check or division creation." };
    } finally {
        if (client) client.release();
    }
}


// ---- Server Action 2: Add/Register Athletes ----

// Define structure for final submission (data sent from client)
interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    // Include all validated data for new athletes (as potentially edited by user)
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: string | null;
    // Include dbAthleteId for matched athletes
    dbAthleteId?: number | null;
}

export async function addAndRegisterAthletes(
    eventId: number,
    divisionId: number, // Expect integer division ID
    athletesToProcess: AthleteToRegister[]
): Promise<{ success: boolean; error?: string; registeredCount?: number }> {

    console.log(`Server Action: addAndRegisterAthletes called for event ${eventId}, division ${divisionId}`);
    // Check if divisionId is a valid number
    if (!eventId || typeof divisionId !== 'number' || isNaN(divisionId) || !athletesToProcess || athletesToProcess.length === 0) {
        return { success: false, error: "Missing or invalid event ID, division ID, or athlete data." };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    let registeredCount = 0;

    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Start transaction

        const athleteIdsToRegister: number[] = [];

        // 1. Insert NEW athletes
        const newAthletes = athletesToProcess.filter(a => a.status === 'new');
        console.log(`Attempting to insert ${newAthletes.length} new athletes.`);
        for (const athlete of newAthletes) {
            // Check required fields based on potentially edited data
            if (!athlete.first_name || !athlete.last_name || !athlete.dob || !athlete.gender) {
                await client.query('ROLLBACK'); // Rollback immediately on finding invalid data for selected new athlete
                console.error(`Missing required data for new athlete at CSV index ${athlete.csvIndex}`, athlete);
                return { success: false, error: `Missing required data (First/Last Name, DOB, Gender) for new athlete at CSV index ${athlete.csvIndex}. Please edit or deselect.` };
            }
            const insertQuery = `
                INSERT INTO ss_athletes (first_name, last_name, dob, gender, nationality, stance, fis_num)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (fis_num) WHERE fis_num IS NOT NULL DO NOTHING
                RETURNING athlete_id;
            `;
            // Ensure optional fields that might be empty string are passed as null
            const stance = athlete.stance === '' ? null : athlete.stance;
            const nationality = athlete.nationality === '' ? null : athlete.nationality;
            const fis_num = athlete.fis_num === '' ? null : athlete.fis_num;

            const res = await client.query(insertQuery, [
                athlete.first_name,
                athlete.last_name,
                athlete.dob, // Expects YYYY-MM-DD string
                athlete.gender,
                nationality,
                stance,
                fis_num // This might be null
            ]);

            if (res.rows.length > 0) {
                // Successfully inserted and got ID back
                athleteIdsToRegister.push(res.rows[0].athlete_id);
                console.log(`Inserted new athlete ${athlete.first_name} ${athlete.last_name}, ID: ${res.rows[0].athlete_id}`);
            } else if (fis_num) {
                 // Insert didn't happen due to FIS conflict, so find the existing ID
                 const findRes = await client.query('SELECT athlete_id FROM ss_athletes WHERE fis_num = $1', [fis_num]);
                 if (findRes.rows.length > 0) {
                     athleteIdsToRegister.push(findRes.rows[0].athlete_id);
                      console.log(`New athlete ${athlete.first_name} already existed (FIS conflict), found ID: ${findRes.rows[0].athlete_id}`);
                 } else {
                      // This is unexpected: conflict occurred but couldn't find the conflicting row.
                      console.warn(`New athlete ${athlete.first_name} with FIS# ${fis_num} insert returned no ID and was not found.`);
                      // Consider throwing an error if an ID is essential here
                      // throw new Error(`Failed to resolve ID for athlete with FIS# ${fis_num} after conflict.`);
                 }
            } else {
                // No ID returned and no FIS number to look up.
                // This might happen if the DB insert truly failed for other reasons,
                // or if there's a unique constraint on something else (e.g., name+dob) we aren't handling.
                 console.warn(`Failed to get ID for new athlete ${athlete.first_name} ${athlete.last_name} (no FIS#). Registration for this athlete might fail.`);
                 // If getting an ID is critical, throw error to stop the process
                 // await client.query('ROLLBACK');
                 // return { success: false, error: `Could not determine athlete ID for ${athlete.first_name} ${athlete.last_name}.`};
            }
        }

        // 2. Add MATCHED athlete IDs
        const matchedAthleteIds = athletesToProcess
            .filter(a => a.status === 'matched' && typeof a.dbAthleteId === 'number') // Ensure dbAthleteId is a number
            .map(a => a.dbAthleteId as number); // Safe assertion after filter
        athleteIdsToRegister.push(...matchedAthleteIds);
        console.log(`Adding ${matchedAthleteIds.length} matched athletes to registration list.`);


        // 3. Insert into ss_event_registrations using unique IDs
        const uniqueAthleteIdsToRegister = Array.from(new Set(athleteIdsToRegister.filter(id => typeof id === 'number'))); // Ensure uniqueness and valid IDs
        console.log(`Attempting to register ${uniqueAthleteIdsToRegister.length} unique athletes into division ${divisionId}.`);

        if (uniqueAthleteIdsToRegister.length > 0) {
             const registrationQuery = `
                INSERT INTO ss_event_registrations (event_id, athlete_id, division_id)
                SELECT $1, athlete_id, $2 -- $2 is the integer divisionId
                FROM unnest($3::int[]) AS athlete_id -- Unnest the array of athlete IDs
                ON CONFLICT (event_id, athlete_id) DO NOTHING; -- Ignore if already registered for this event
            `;
             const regRes = await client.query(registrationQuery, [eventId, divisionId, uniqueAthleteIdsToRegister]);
             registeredCount = regRes.rowCount ?? 0; // rowCount indicates successful non-conflicting inserts
             console.log(`Inserted ${registeredCount} new registrations.`);
        } else {
            console.log("No unique, valid athlete IDs identified for registration.");
        }


        await client.query('COMMIT'); // Commit transaction
        console.log("Transaction committed.");

        // Revalidate paths to update UI potentially showing registered athletes
        revalidatePath(`/admin/events/${eventId}`); // Event dashboard
        revalidatePath(`/admin/events/${eventId}/manage-athletes`); // This page

        return { success: true, registeredCount };

    } catch (error) {
        await client?.query('ROLLBACK'); // Rollback on ANY error during the process
        console.error("Error processing athlete registration:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
        return { success: false, error: `Registration failed: ${errorMessage}` };
    } finally {
        if (client) client.release();
    }
}