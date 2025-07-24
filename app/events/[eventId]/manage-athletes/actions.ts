// app\events\[eventId]\manage-athletes\actions.ts

'use server';

import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { fetchRegisteredAthletesForEvent } from '@/lib/data';
import { RegisteredAthlete, Athlete } from '@/lib/definitions';
import Papa from 'papaparse';
import { z } from 'zod';

// --- Types for Action Results ---
export interface ActionResult { // Renamed for clarity, also used by removeAthlete
    success: boolean;
    message?: string;
    error?: string;
}

export interface GetAthletesActionResult extends ActionResult {
    data?: RegisteredAthlete[];
}

export interface ImportAthletesActionResult extends ActionResult {
    importedCount?: number;
    createdCount?: number;
    updatedCount?: number;
    skippedCount?: number;
    errors?: Array<{ row: number; message: string; data?: any }>;
}

// --- Action to Get Athletes for an Event ---
export async function getEventAthletesAction(eventId: number): Promise<GetAthletesActionResult> {
    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, error: "Authentication required." };

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

// --- Zod Schema for CSV row validation ---
const CsvAthleteRowSchema = z.object({
    first_name: z.string().trim().min(1, "First name is required."),
    last_name: z.string().trim().min(1, "Last name is required."),
    dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD format.")
        .transform((val) => new Date(val + "T00:00:00")),
    gender: z.string().trim().min(1, "Gender is required."),
    bib_num: z.preprocess((val) => (val === '' || val === null ? null : String(val).trim()), z.string().optional().nullable()),
    nationality: z.preprocess((val) => (val === '' || val === null ? null : String(val).trim()), z.string().optional().nullable()),
    stance: z.preprocess((val) => (val === '' ? null : val), z.enum(['Regular', 'Goofy']).optional().nullable()),
    fis_num: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().int().optional().nullable()),
    fis_hp_points: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().optional().nullable()),
    fis_ss_points: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().optional().nullable()),
    fis_ba_points: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().optional().nullable()),
    wspl_points: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().optional().nullable()),
});

export async function importAthletesFromCsvAction(
    prevState: ImportAthletesActionResult | null,
    formData: FormData
): Promise<ImportAthletesActionResult> {
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
            transformHeader: header => header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, ''),
        }).data;
    } catch (parseError) {
        return { success: false, error: "Failed to parse CSV file." };
    }
    if (parsedCsvData.length === 0) {
        return { success: false, error: "CSV file contains no data rows." };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    let importedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: Array<{ row: number; message: string; data?: any }> = [];

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        for (let i = 0; i < parsedCsvData.length; i++) {
            const rawRowData = parsedCsvData[i];
            const rowIndexForError = i + 2;

            const validation = CsvAthleteRowSchema.safeParse(rawRowData);

            if (!validation.success) {
                skippedCount++;
                importErrors.push({
                    row: rowIndexForError,
                    message: "Invalid data: " + validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
                    data: rawRowData
                });
                continue;
            }

            const validatedData = validation.data;
            let athleteId: number;
            
            let existingAthleteResult;
            if (validatedData.fis_num) {
                existingAthleteResult = await client.query<Pick<Athlete, 'athlete_id'>>("SELECT athlete_id FROM ss_athletes WHERE fis_num = $1 LIMIT 1", [validatedData.fis_num]);
            }
            if (!existingAthleteResult || existingAthleteResult.rows.length === 0) {
                existingAthleteResult = await client.query<Pick<Athlete, 'athlete_id'>>("SELECT athlete_id FROM ss_athletes WHERE lower(first_name) = lower($1) AND lower(last_name) = lower($2) AND dob = $3 LIMIT 1", [validatedData.first_name, validatedData.last_name, validatedData.dob]);
            }

            if (existingAthleteResult && existingAthleteResult.rows.length > 0) {
                athleteId = existingAthleteResult.rows[0].athlete_id;
                await client.query(
                    `UPDATE ss_athletes SET
                        first_name = $1, last_name = $2, dob = $3, gender = $4,
                        nationality = $5, stance = $6, fis_num = $7, 
                        fis_hp_points = $8, fis_ss_points = $9, 
                        fis_ba_points = $10, wspl_points = $11
                     WHERE athlete_id = $12`,
                    [
                        validatedData.first_name, validatedData.last_name, validatedData.dob,
                        validatedData.gender, validatedData.nationality, validatedData.stance,
                        validatedData.fis_num, validatedData.fis_hp_points, validatedData.fis_ss_points,
                        validatedData.fis_ba_points, validatedData.wspl_points,
                        athleteId
                    ]
                );
            } else {
                const insertAthleteResult = await client.query<{ athlete_id: number }>(
                    `INSERT INTO ss_athletes (
                        first_name, last_name, dob, gender, nationality, stance, fis_num,
                        fis_hp_points, fis_ss_points, fis_ba_points, wspl_points
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING athlete_id`,
                    [
                        validatedData.first_name, validatedData.last_name, validatedData.dob,
                        validatedData.gender, validatedData.nationality, validatedData.stance,
                        validatedData.fis_num, validatedData.fis_hp_points, validatedData.fis_ss_points,
                        validatedData.fis_ba_points, validatedData.wspl_points
                    ]
                );
                athleteId = insertAthleteResult.rows[0].athlete_id;
                createdCount++;
            }

            const registrationResult = await client.query(
                `INSERT INTO ss_event_registrations (event_id, athlete_id, bib_num)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (event_id, athlete_id) DO UPDATE SET bib_num = EXCLUDED.bib_num
                 RETURNING xmax;`,
                [eventId, athleteId, validatedData.bib_num]
            );

            if (registrationResult.rows.length > 0) {
                if (String(registrationResult.rows[0].xmax) === '0') {
                    importedCount++;
                } else {
                    updatedCount++;
                }
            }
        }

        await client.query('COMMIT');
        revalidatePath(`/admin/events/${eventId}/manage-athletes`);
        return {
            success: true,
            message: `Import complete. Newly Registered: ${importedCount}. Registrations Updated: ${updatedCount}. New Athlete Profiles: ${createdCount}. Skipped: ${skippedCount}.`,
            importedCount, createdCount, updatedCount, skippedCount, errors: importErrors
        };
    } catch (error) {
        await client?.query('ROLLBACK');
        console.error("importAthletesFromCsvAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        importErrors.push({ row: 0, message: `Transaction failed and was rolled back: ${errorMessage}` });
        return { success: false, error: errorMessage, errors: importErrors, importedCount, skippedCount, createdCount, updatedCount };
    } finally {
        if (client) client.release();
    }
}