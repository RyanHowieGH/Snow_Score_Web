'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { fetchRegisteredAthletesForEvent, type RegisteredAthlete, type Athlete } from '@/lib/data';
import Papa from 'papaparse';

// --- Types for Action Results ---
interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
}

interface GetAthletesActionResult extends ActionResult {
    data?: RegisteredAthlete[];
}

interface ImportAthletesActionResult extends ActionResult {
    importedCount?: number;
    skippedCount?: number;
    createdCount?: number;
    updatedCount?: number; // Count of athletes whose registration was updated (e.g., bib_num)
    errors?: Array<{ row: number; message: string; data?: any }>;
}

// --- Action to Get Athletes for an Event (for Client-Side Refresh) ---
export async function getEventAthletesAction(eventId: number): Promise<GetAthletesActionResult> {
    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };
    // Add role check if needed

    if (isNaN(eventId)) {
        return { success: false, error: "Invalid Event ID." };
    }
    try {
        const athletes = await fetchRegisteredAthletesForEvent(eventId);
        return { success: true, data: athletes };
    } catch (error) {
        console.error("getEventAthletesAction error:", error);
        return { success: false, error: "Failed to fetch athletes." };
    }
}

// --- Action to Remove an Athlete from an Event ---
export async function removeAthleteFromEventAction(eventId: number, athleteId: number): Promise<ActionResult> {
    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, error: "Permission denied." };
    }

    if (isNaN(eventId) || isNaN(athleteId)) {
        return { success: false, error: "Invalid Event or Athlete ID." };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query(
            "DELETE FROM ss_event_registrations WHERE event_id = $1 AND athlete_id = $2",
            [eventId, athleteId]
        );

        if (result.rowCount != null && result.rowCount > 0) {
            revalidatePath(`/admin/events/${eventId}/manage-athletes`);
            return { success: true, message: "Athlete removed from event." };
        } else {
            return { success: false, error: "Athlete not found in this event or already removed." };
        }
    } catch (error) {
        console.error("removeAthleteFromEventAction error:", error);
        return { success: false, error: "Database error removing athlete." };
    } finally {
        if (client) client.release();
    }
}

// Zod schema for a single row in the CSV
const CsvAthleteRowSchema = z.object({
    first_name: z.string().trim().min(1, "First name is required."),
    last_name: z.string().trim().min(1, "Last name is required."),
    // DOB is tricky: CSV will be string, DB expects Date.
    // For robust parsing, expect string and transform/validate.
    dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD format.")
        .transform((val) => {
            const date = new Date(val + "T00:00:00"); // Ensure parsing in local timezone context or UTC
            if (isNaN(date.getTime())) throw new Error("Invalid date value for DOB.");
            return date;
        }),
    gender: z.string().trim().min(1, "Gender is required."), // You might want an enum: z.enum(['Male', 'Female', 'Other'])
    bib_num: z.string().trim().optional().nullable().default(null), // Bib number is optional, treat empty as null
    // Optional athlete profile fields
    nationality: z.string().trim().optional().nullable().default(null),
    stance: z.string().trim().optional().nullable().default(null),
    fis_num: z.string().trim().optional().nullable().default(null),
});


export async function importAthletesFromCsvAction(formData: FormData): Promise<ImportAthletesActionResult> {
    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, error: "Permission denied." };
    }

    const eventIdString = formData.get('eventId');
    const csvFile = formData.get('csvFile') as File;

    if (!eventIdString || typeof eventIdString !== 'string' || isNaN(parseInt(eventIdString))) {
        return { success: false, error: "Invalid or missing Event ID." };
    }
    const eventId = parseInt(eventIdString);

    if (!csvFile || csvFile.size === 0) {
        return { success: false, error: "No CSV file provided or file is empty." };
    }

    const fileContent = await csvFile.text();
    let parsedCsvData: any[];

    try {
        parsedCsvData = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, ''), // Normalize headers
        }).data;
    } catch (parseError) {
        console.error("CSV Parse Error:", parseError);
        return { success: false, error: "Failed to parse CSV file." };
    }

    if (parsedCsvData.length === 0) {
        return { success: false, error: "CSV file contains no data rows (after header)." };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    let importedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: Array<{ row: number; message: string; data?: any }> = [];

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        for (let i = 0; i < parsedCsvData.length; i++) {
            const rawRowData = parsedCsvData[i];
            const rowIndexForError = i + 2; // 1 for 0-index, 1 for header

            const validation = CsvAthleteRowSchema.safeParse(rawRowData);

            if (!validation.success) {
                skippedCount++;
                importErrors.push({
                    row: rowIndexForError,
                    message: "Invalid data in row. " + validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
                    data: rawRowData
                });
                console.warn(`Skipping row ${rowIndexForError} due to validation errors:`, validation.error.flatten().fieldErrors);
                continue;
            }

            const { first_name, last_name, dob, gender, bib_num, nationality, stance, fis_num } = validation.data;
            let athleteId: number;

            // Strategy:
            // 1. Try to find by fis_num (if provided and considered unique)
            // 2. Else, try to find by first_name, last_name, dob
            // 3. If found, use existing athlete_id. Optionally update athlete's profile info.
            // 4. If not found, create new athlete.
            // 5. Register (or update registration for) athlete to event.

            let existingAthleteResult;
            if (fis_num && fis_num.trim() !== "") {
                existingAthleteResult = await client.query<Pick<Athlete, 'athlete_id'>>(
                    "SELECT athlete_id FROM ss_athletes WHERE fis_num = $1 LIMIT 1", [fis_num]
                );
            }

            if (!existingAthleteResult || existingAthleteResult.rows.length === 0) {
                existingAthleteResult = await client.query<Pick<Athlete, 'athlete_id'>>(
                    "SELECT athlete_id FROM ss_athletes WHERE lower(first_name) = lower($1) AND lower(last_name) = lower($2) AND dob = $3 LIMIT 1",
                    [first_name, last_name, dob]
                );
            }

            if (existingAthleteResult && existingAthleteResult.rows.length > 0) {
                athleteId = existingAthleteResult.rows[0].athlete_id;
                // Optionally update existing athlete's profile details if they differ.
                // This could be a separate function or more complex logic.
                // For now, we assume CSV might have bib_num to update for registration.
            } else {
                // Create new athlete
                const insertAthleteResult = await client.query<{ athlete_id: number }>(
                    `INSERT INTO ss_athletes (first_name, last_name, dob, gender, nationality, stance, fis_num)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING athlete_id`,
                    [first_name, last_name, dob, gender, nationality || null, stance || null, fis_num || null]
                );
                athleteId = insertAthleteResult.rows[0].athlete_id;
                createdCount++;
            }

            // Register athlete to the event
            // ON CONFLICT: if athlete already registered for event, update their bib_num.
            // If bib_num must be unique per event, this simple ON CONFLICT might not be enough.
            const registrationResult = await client.query(
                `INSERT INTO ss_event_registrations (event_id, athlete_id, bib_num)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (event_id, athlete_id) DO UPDATE SET bib_num = EXCLUDED.bib_num
                 RETURNING xmax;`, // xmax is 0 if INSERT, non-zero if UPDATE
                [eventId, athleteId, bib_num || null]
            );

            if (registrationResult.rows.length > 0) {
                if (registrationResult.rows[0].xmax === 0) { // xmax = 0 for INSERT
                    importedCount++;
                } else { // xmax != 0 for UPDATE
                    updatedCount++;
                }
            } else {
                // This case should ideally not happen with the ON CONFLICT above unless something went very wrong.
                skippedCount++;
                importErrors.push({ row: rowIndexForError, message: `Failed to register ${first_name} ${last_name}.`, data: rawRowData });
            }
        }

        await client.query('COMMIT');
        revalidatePath(`/admin/events/${eventId}/manage-athletes`);
        return {
            success: true,
            message: `Import complete. Processed: ${importedCount + updatedCount}. New Athletes: ${createdCount}. Registrations Updated: ${updatedCount}. Skipped Rows: ${skippedCount}.`,
            importedCount: importedCount + updatedCount, // Total successfully associated
            createdCount,
            updatedCount,
            skippedCount,
            errors: importErrors
        };

    } catch (error) {
        await client?.query('ROLLBACK');
        console.error("importAthletesFromCsvAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import.";
        importErrors.push({ row: 0, message: `Transaction rolled back: ${errorMessage}` });
        return { success: false, error: errorMessage, errors: importErrors, importedCount, skippedCount, createdCount, updatedCount };
    } finally {
        if (client) client.release();
    }
}