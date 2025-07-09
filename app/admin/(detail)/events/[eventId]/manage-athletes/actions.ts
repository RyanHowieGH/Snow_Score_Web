// app\admin\(detail)\events\[eventId]\manage-athletes\actions.ts

'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
// Import your central data fetching functions and types
import { getDivisionsForEvent, fetchAllAthletes, fetchRosterForEvent } from '@/lib/data';
import type { Division, Athlete, CheckedAthleteClient, AthleteToRegister, RegistrationResultDetail, RegisteredAthleteWithDivision } from '@/lib/definitions';


// --- Zod Schema for robust CSV validation (WITH THE FIXES) ---
const AthleteCsvSchema = z.object({
    last_name: z.string().min(1, "Last name is required."),
    first_name: z.string().min(1, "First name is required."),
    // Transform dob string into a Date object upon successful validation
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD.").transform((dateStr, ctx) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            ctx.addIssue({ code: z.ZodIssueCode.invalid_date, message: "Invalid date." });
            return z.NEVER;
        }
        return date;
    }),
    gender: z.string().min(1, "Gender is required."),
    nationality: z.string().length(3, "Nationality must be 3 letters.").toUpperCase().nullable().optional().transform(val => val === '' ? null : val),
    stance: z.enum(['Regular', 'Goofy', '']).nullable().optional().transform(val => val === '' ? null : val),
    // Keep fis_num as a string during this validation phase
    fis_num: z.preprocess((val) => (typeof val === 'string' && val.trim() !== '') ? val.trim() : null, z.string().regex(/^\d{7}$/, "FIS number must be 7 digits.").nullable().optional()),
});

// --- Helper Authorization Function ---
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

// --- Action 2: Check Athletes Against DB (The Review Step) ---
export async function checkAthletesAgainstDb(
    eventId: number,
    parsedAthletesFromCsv: unknown[]
): Promise<{ success: boolean; data?: { athletes: CheckedAthleteClient[], divisions: Division[] }; error?: string }> {
    try {
        await authorizeAction();
        
        const [allAthletesInDb, eventDivisions] = await Promise.all([ fetchAllAthletes(), getDivisionsForEvent(eventId) ]);
        if (eventDivisions.length === 0) {
            return { success: false, error: "This event has no assigned divisions. Please add divisions in 'Event Setup' first." };
        }

        const checkedAthletes: CheckedAthleteClient[] = parsedAthletesFromCsv.map((row, index) => {
            const validation = AthleteCsvSchema.safeParse(row);
            
            if (!validation.success) {
                return {
                    csvIndex: index, status: 'error',
                    csvData: { ...row as any }, // Show the raw data that failed
                    validationError: JSON.stringify(validation.error.flatten().fieldErrors),
                };
            }
            
            const csvAthlete = validation.data; // csvAthlete.dob is now a Date object
            
            // Match by a combination of first name, last name, and date of birth.
            const matchedDbAthlete = allAthletesInDb.find(dbAthlete =>
                dbAthlete.first_name.toLowerCase() === csvAthlete.first_name.toLowerCase() &&
                dbAthlete.last_name.toLowerCase() === csvAthlete.last_name.toLowerCase() &&
                new Date(dbAthlete.dob).toISOString().split('T')[0] === csvAthlete.dob.toISOString().split('T')[0]
            );

            let suggestedDivision: Division | undefined;
            const genderUpper = csvAthlete.gender.toUpperCase();
            if (['M', 'MALE', 'MEN'].includes(genderUpper)) {
                suggestedDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'MALE') || eventDivisions.find(d => d.division_name.toUpperCase() === 'MEN');
            } else if (['F', 'FEMALE', 'WOMEN', 'W'].includes(genderUpper)) {
                suggestedDivision = eventDivisions.find(d => d.division_name.toUpperCase() === 'FEMALE') || eventDivisions.find(d => d.division_name.toUpperCase() === 'WOMEN');
            }

            return {
                csvIndex: index,
                status: matchedDbAthlete ? 'matched' : 'new',
                csvData: {
                    ...csvAthlete,
                    dob: csvAthlete.dob.toISOString().split('T')[0], // Convert Date back to string for UI
                },
                dbAthleteId: matchedDbAthlete?.athlete_id ?? null,
                dbDetails: matchedDbAthlete ? {
                    first_name: matchedDbAthlete.first_name, last_name: matchedDbAthlete.last_name,
                    dob: new Date(matchedDbAthlete.dob).toISOString().split('T')[0],
                    gender: matchedDbAthlete.gender, nationality: matchedDbAthlete.nationality,
                    stance: matchedDbAthlete.stance, fis_num: matchedDbAthlete.fis_num,
                } : undefined,
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

// --- Action 3: Add and Register Confirmed Athletes (The Final Step) ---
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
                // If it's a new athlete, insert them into ss_athletes first
                if (athlete.status === 'new' && !athleteId) {
                    const insertAthleteResult = await client.query(
                        `INSERT INTO ss_athletes (last_name, first_name, dob, gender, nationality, stance, fis_num) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING athlete_id;`,
                        [athlete.last_name, athlete.first_name, athlete.dob, athlete.gender, athlete.nationality, athlete.stance, athlete.fis_num]
                    );
                    athleteId = insertAthleteResult.rows[0].athlete_id;
                }

                if (!athleteId || !athlete.division_id) {
                    throw new Error(`Missing athlete or division ID for ${athleteName}.`);
                }

                const regRes = await client.query(
                    `INSERT INTO ss_event_registrations (event_id, athlete_id, division_id)
                     VALUES ($1, $2, $3) ON CONFLICT (event_id, division_id, athlete_id) DO NOTHING;`,
                    [eventId, athleteId, athlete.division_id]
                );

                if ((regRes?.rowCount ?? 0) > 0) {
                    registeredCount++;
                    registrationDetails.push({ athleteName, status: "Successfully Registered." });
                } else {
                    registrationDetails.push({ athleteName, status: "Already registered." });
                }
            } catch (innerError) {
                const message = innerError instanceof Error ? innerError.message : "Unknown registration error.";
                registrationDetails.push({ athleteName, status: "Failed to Register", error: message });
            }
        }
        
        // If any detail entry contains an error, the entire transaction should fail.
        if (registrationDetails.some(d => d.error)) {
            throw new Error("One or more athletes failed to register. Rolling back all changes.");
        }

        await client.query('COMMIT');
        revalidatePath(`/admin/events/${eventId}`);
        return { success: true, registeredCount, details: registrationDetails };

    } catch (error) {
        await client.query('ROLLBACK');
        const message = error instanceof Error ? error.message : "A critical server error occurred.";
        console.error("CRITICAL error in addAndRegisterAthletes transaction:", error);
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