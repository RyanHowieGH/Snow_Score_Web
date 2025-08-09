// app\admin\(detail)\events\[eventId]\manage-athletes\actions.ts

'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { getDivisionsForEvent, fetchAllAthletes, fetchRosterForEvent } from '@/lib/data';
import type { Division, Athlete, CheckedAthleteClient, AthleteToRegister, RegistrationResultDetail, RegisteredAthleteWithDivision, AthleteAsString } from '@/lib/definitions';

// --- Zod Schema  ---
const AthleteCsvSchema = z.object({
    last_name: z.string().min(1, "Last name is required."),
    first_name: z.string().min(1, "First name is required."),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD.").transform((dateStr) => new Date(dateStr)),
    gender: z.string().min(1, "Gender is required."),
    nationality: z.string().length(3).toUpperCase().optional().transform(val => val === '' ? null : val).nullable(),
    stance: z.enum(['Regular', 'Goofy', '']).optional().transform(val => val === '' ? null : val).nullable(),
    fis_num: z.preprocess((val) => (val === '' ? null : val), z.string().regex(/^\d{7}$/).optional().nullable()),
    fis_hp_points: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.coerce.number().optional().nullable()),
    fis_ss_points: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.coerce.number().optional().nullable()),
    fis_ba_points: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.coerce.number().optional().nullable()),
    wspl_points: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.coerce.number().optional().nullable()),
});

// --- Helper Authorization Function (no changes needed) ---
async function authorizeAction() {
    const user = await getAuthenticatedUserWithRole();
    if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
        throw new Error('Unauthorized');
    }
}


// --- Action 1: Get Event Divisions (Wrapper for security) ---
export async function getEventDivisions(eventId: number): Promise<{ success: boolean; data?: Division[]; error?: string }> {
    try {
        await authorizeAction();
        const divisions = await getDivisionsForEvent(eventId);
        return { success: true, data: divisions };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to fetch event divisions: ${message}` };
    }
}

// --- Action 2: Check Athletes Against DB (Fully Corrected) ---
export async function checkAthletesAgainstDb(
    eventId: number,
    parsedAthletesFromCsv: unknown[]
): Promise<{ success: boolean; data?: { athletes: CheckedAthleteClient[], divisions: Division[] }; error?: string }> {
    try {
        await authorizeAction();
        
        const [allAthletesInDb, eventDivisions] = await Promise.all([ fetchAllAthletes(), getDivisionsForEvent(eventId) ]);
        if (eventDivisions.length === 0) {
            return { success: false, error: "This event has no assigned divisions." };
        }

        const checkedAthletes: CheckedAthleteClient[] = parsedAthletesFromCsv.map((row, index) => {
            const validation = AthleteCsvSchema.safeParse(row);
            
            if (!validation.success) {
                return {
                    csvIndex: index, status: 'error',
                    csvData: { ...row as any },
                    validationError: JSON.stringify(validation.error.flatten().fieldErrors),
                };
            }
            
            const csvAthlete = validation.data;
            
            const nameDobMatch = allAthletesInDb.find(dbAthlete =>
                dbAthlete.first_name.toLowerCase() === csvAthlete.first_name.toLowerCase() &&
                dbAthlete.last_name.toLowerCase() === csvAthlete.last_name.toLowerCase() &&
                new Date(dbAthlete.dob).toISOString().split('T')[0] === csvAthlete.dob.toISOString().split('T')[0]
            );

            const fisNumAsInt = csvAthlete.fis_num ? parseInt(csvAthlete.fis_num, 10) : null;
            const fisNumMatch = fisNumAsInt ? allAthletesInDb.find(dbAthlete => dbAthlete.fis_num === fisNumAsInt) : undefined;

            let suggestedDivision: Division | undefined;
            const genderUpper = csvAthlete.gender.toUpperCase();
            if (['M', 'MALE', 'MEN'].includes(genderUpper)) {
                suggestedDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'MALE') || eventDivisions.find(d => d.division_name.toUpperCase() === 'MEN');
            } else if (['F', 'FEMALE', 'WOMEN', 'W'].includes(genderUpper)) {
                suggestedDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'FEMALE') || eventDivisions.find(d => d.division_name.toUpperCase() === 'WOMEN');
            }
            
            const formatAthleteForUI = (athlete: Athlete): AthleteAsString => ({
                ...athlete,
                dob: new Date(athlete.dob).toISOString().split('T')[0],
            });

            // This object now perfectly matches the `CheckedAthleteClient['csvData']` type
            const formattedCsvData = {
                last_name: csvAthlete.last_name,
                first_name: csvAthlete.first_name,
                dob: csvAthlete.dob.toISOString().split('T')[0],
                gender: csvAthlete.gender,
                nationality: csvAthlete.nationality ?? null,
                stance: csvAthlete.stance ?? null,
                fis_num: csvAthlete.fis_num ?? null,
                fis_hp_points: csvAthlete.fis_hp_points ?? null,
                fis_ss_points: csvAthlete.fis_ss_points ?? null,
                fis_ba_points: csvAthlete.fis_ba_points ?? null,
                wspl_points: csvAthlete.wspl_points ?? null,
            };

            if (nameDobMatch) {
                return {
                    csvIndex: index,
                    status: 'matched',
                    csvData: formattedCsvData,
                    dbAthleteId: nameDobMatch.athlete_id,
                    dbDetails: formatAthleteForUI(nameDobMatch),
                    suggested_division_id: suggestedDivision?.division_id ?? null,
                    suggested_division_name: suggestedDivision?.division_name ?? null,
                };
            }

            if (fisNumMatch) {
                return {
                    csvIndex: index,
                    status: 'conflict',
                    csvData: formattedCsvData,
                    dbAthleteId: fisNumMatch.athlete_id,
                    conflictDetails: {
                        conflictOn: 'fis_num',
                        conflictingAthlete: formatAthleteForUI(fisNumMatch)
                    },
                    suggested_division_id: suggestedDivision?.division_id ?? null,
                    suggested_division_name: suggestedDivision?.division_name ?? null,
                };
            }

            return {
                csvIndex: index,
                status: 'new',
                csvData: formattedCsvData,
                dbAthleteId: null,
                suggested_division_id: suggestedDivision?.division_id ?? null,
                suggested_division_name: suggestedDivision?.division_name ?? null,
            };
        });

        return { success: true, data: { athletes: checkedAthletes, divisions: eventDivisions } };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        return { success: false, error: message };
    }
}


// --- Action 3: Add and Register Confirmed Athletes (Fully Corrected) ---
export async function addAndRegisterAthletes(
    eventId: number,
    athletesToRegister: AthleteToRegister[]
): Promise<{ success: boolean; error?: string; registeredCount?: number, details?: RegistrationResultDetail[] }> {
    try {
        await authorizeAction();
    } catch(err) {
        return { success: false, error: 'Unauthorized.' };
    }
    if (!eventId || !athletesToRegister || athletesToRegister.length === 0) {
        return { success: false, error: "Missing or invalid event ID or athlete data." };
    }

    const client: PoolClient = await getDbPool().connect();
    let registeredCount = 0;
    const registrationDetails: RegistrationResultDetail[] = [];

    try {
        await client.query('BEGIN');

        for (const athlete of athletesToRegister) {
            const athleteName = `${athlete.first_name} ${athlete.last_name}`;
            let athleteId = athlete.dbAthleteId;

            try {
                if (athlete.isOverwrite && athleteId) {
                    // UPDATE statement now includes the new points fields
                    await client.query(
                        `UPDATE ss_athletes SET 
                            last_name = $1, first_name = $2, dob = $3, gender = $4, nationality = $5, stance = $6, fis_num = $7,
                            fis_hp_points = $8, fis_ss_points = $9, fis_ba_points = $10, wspl_points = $11 
                         WHERE athlete_id = $12;`,
                        [
                            athlete.last_name, athlete.first_name, athlete.dob, athlete.gender, athlete.nationality, 
                            athlete.stance, athlete.fis_num,
                            athlete.fis_hp_points, athlete.fis_ss_points, athlete.fis_ba_points, athlete.wspl_points,
                            athleteId
                        ]
                    );
                } else if (athlete.status === 'new' && !athleteId) {
                    // INSERT statement now includes the new points fields
                    const insertAthleteResult = await client.query(
                        `INSERT INTO ss_athletes (
                            last_name, first_name, dob, gender, nationality, stance, fis_num,
                            fis_hp_points, fis_ss_points, fis_ba_points, wspl_points
                         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING athlete_id;`,
                        [
                            athlete.last_name, athlete.first_name, athlete.dob, athlete.gender, athlete.nationality, 
                            athlete.stance, athlete.fis_num,
                            athlete.fis_hp_points, athlete.fis_ss_points, athlete.fis_ba_points, athlete.wspl_points
                        ]
                    );
                    athleteId = insertAthleteResult.rows[0].athlete_id;
                }

                if (!athleteId || !athlete.division_id) {
                    throw new Error(`Missing athlete ID or assigned division ID for ${athleteName}.`);
                }

                const regRes = await client.query(
                    `INSERT INTO ss_event_registrations (event_id, athlete_id, division_id) VALUES ($1, $2, $3) ON CONFLICT (event_id, division_id, athlete_id) DO NOTHING;`,
                    [eventId, athleteId, athlete.division_id]
                );

                if ((regRes?.rowCount ?? 0) > 0) {
                    registeredCount++;
                    const statusMsg = athlete.isOverwrite ? "Overwritten & Registered." : "Successfully Registered.";
                    registrationDetails.push({ athleteName, status: statusMsg });
                } else {
                    registrationDetails.push({ athleteName, status: "Already registered." });
                }
            } catch (innerError) {
                const message = innerError instanceof Error ? innerError.message : "Unknown registration error.";
                registrationDetails.push({ athleteName, status: "Failed to Register", error: message });
            }
        }
        
        if (registrationDetails.some(d => d.error)) {
            throw new Error("One or more athletes failed to register. Rolling back all changes.");
        }

        await client.query('COMMIT');
        revalidatePath(`/admin/events/${eventId}/manage-athletes`);
        return { success: true, registeredCount, details: registrationDetails };

    } catch (error) {
        await client.query('ROLLBACK');
        const message = error instanceof Error ? error.message : "A critical server error occurred.";
        return { success: false, error: message, details: registrationDetails };
    } finally {
        client.release();
    }
}

export async function deleteRegistrationAction(
  eventId: number,
  athleteId: number,
  divisionId: number
): Promise<{ success: boolean; message: string }> {
  try {
    await authorizeAction(); // Reuse your security check

    const pool = getDbPool();
    const query = `
      DELETE FROM ss_event_registrations
      WHERE event_id = $1 AND athlete_id = $2 AND division_id = $3;
    `;
    const result = await pool.query(query, [eventId, athleteId, divisionId]);

    if ((result?.rowCount ?? 0) > 0) {
      revalidatePath(`/admin/events/${eventId}/manage-athletes`);
      return { success: true, message: "Athlete removed from event." };
    } else {
      return { success: false, message: "Failed to find registration to delete." };
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : "A database error occurred.";
    console.error("Error in deleteRegistrationAction:", error);
    return { success: false, message };
  }
}

// --- Action to update multiple athletes' bib numbers in an event ---
export async function updateBibNumbersAction(
  eventId: number,
  updates: { athleteId: number; divisionId: number; bibNum: string | null }[],
): Promise<{ success: boolean; message?: string; error?: string }> {
  const client = await getDbPool().connect();
  try {
    await authorizeAction();

    await client.query('BEGIN');
    for (const { athleteId, divisionId, bibNum } of updates) {
      await client.query(
        `UPDATE ss_event_registrations
         SET bib_num = $1
         WHERE event_id = $2 AND athlete_id = $3 AND division_id = $4`,
        [bibNum, eventId, athleteId, divisionId],
      );
    }
    await client.query('COMMIT');
    revalidatePath(`/admin/events/${eventId}/manage-athletes`);
    return { success: true, message: 'Bib numbers updated.' };
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'Failed to update bib numbers.';
    console.error('updateBibNumbersAction error:', error);
    return { success: false, error: message };
  } finally {
    client.release();

  }
}

// --- Action to get the current event roster ---
export async function getEventRoster(eventId: number): Promise<{
    success: boolean;
    data?: RegisteredAthleteWithDivision[];
    error?: string
}> {
    try {
        await authorizeAction();
        const roster = await fetchRosterForEvent(eventId);
        return { success: true, data: roster };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load roster.";
        return { success: false, error: message };
    }
}

const EXPECTED_CSV_HEADERS = [
    'last_name', 'first_name', 'dob', 'gender', 'nationality', 'stance', 'fis_num',
    'fis_hp_points', 'fis_ss_points', 'fis_ba_points', 'wspl_points'
];

export async function validateCsvHeadersAction(
    headers: string[]
): Promise<{ success: boolean; error?: string }> {
    'use server';

    try {
        await authorizeAction(); // Reuse your security check

        const missingHeaders = EXPECTED_CSV_HEADERS.filter(
            expectedHeader => !headers.includes(expectedHeader)
        );

        if (missingHeaders.length > 0) {
            const errorMessage = `Invalid CSV format. The following required columns are missing: ${missingHeaders.join(', ')}.`;
            console.error(errorMessage);
            return { success: false, error: errorMessage };
        }

        return { success: true };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        return { success: false, error: message };
    }
}