// app/admin/(standard)/athletes/actions.ts
'use server';

import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { z } from 'zod';

// Schema to validate the Athlete ID is a positive integer
const AthleteIdSchema = z.coerce.number().int().positive("Invalid Athlete ID.");

// Define return type for the action result
interface DeleteActionResult {
    success: boolean;
    message: string; // User-friendly result message
    error?: string;   // Optional technical error detail or code
}

// Server Action to delete an athlete
export async function deleteAthleteAction(athleteIdInput: unknown): Promise<DeleteActionResult> {

    // 1. Authorization Check: Verify user role
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required.", error: "Unauthorized" };
    }
    // Define roles allowed to delete athletes
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to delete athletes.", error: "Forbidden" };
    }

    // 2. Validate Input ID using Zod
    const validation = AthleteIdSchema.safeParse(athleteIdInput);
    if (!validation.success) {
        const errorMessage = validation.error.flatten().formErrors.join(', ');
        console.error("Invalid Athlete ID provided for deletion:", athleteIdInput, errorMessage);
        return { success: false, message: `Invalid Athlete ID: ${errorMessage}`, error: "Validation Failed" };
    }
    const athleteId = validation.data; // Validated positive integer athlete ID

    // 3. Database Deletion Attempt
    console.log(`User ${user.email} (Role: ${user.roleName}) attempting to delete athlete ID: ${athleteId}`);
    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        // Execute the DELETE query
        const deleteQuery = `DELETE FROM ss_athletes WHERE athlete_id = $1`;
        const result = await client.query(deleteQuery, [athleteId]);

        // Check if a row was actually deleted
        if (result.rowCount === 1) {
            console.log(`Successfully deleted athlete ID: ${athleteId}`);
            // Revalidate the athletes list path to refresh the UI
            revalidatePath('/admin/athletes');
            return { success: true, message: "Athlete deleted successfully." };
        } else {
            // Athlete ID wasn't found (might have been deleted already)
            console.warn(`Attempted to delete athlete ID ${athleteId}, but no rows were affected.`);
            return { success: false, message: "Athlete not found or already deleted.", error: "Not Found" };
        }

    } catch (error: unknown) { // Use 'unknown' type for catch variable
        // Log the raw error for server-side debugging
        console.error(`Database error deleting athlete ID ${athleteId}:`, error);

        let userMessage = "Could not delete athlete due to a database error.";
        let errorCode = 'DB Error';

        // Type guard to check if it's a Postgres-like error with a code
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const pgErrorCode = String(error.code); // Convert code to string for comparison
            errorCode = pgErrorCode; // Store the actual code

            // Check for Foreign Key violation (Postgres code '23503')
            if (pgErrorCode === '23503') {
                userMessage = "Cannot delete athlete: They are likely registered for an event or have associated results.";
                console.warn(`Deletion of athlete ID ${athleteId} failed due to foreign key constraint.`);
            } else if (error instanceof Error) {
            }
        } else if (error instanceof Error) {
             // Fallback if it's a generic Error object without a code
             userMessage = `Database error: ${error.message}`;
        }

        // Return a user-friendly message and the error code/status
        return { success: false, message: userMessage, error: errorCode };
    } finally {
        // Ensure the database client is always released
        if (client) client.release();
    }
}

const UpdateAthleteSchema = z.object({
    athleteId: z.coerce.number().int().positive(),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be in YYYY-MM-DD format."),
    gender: z.string().min(1, "Gender is required."),
    nationality: z.string().length(3, "Nationality must be 3 letters.").toUpperCase().nullable(),
    stance: z.enum(['Regular', 'Goofy']).nullable(),
    fisNum: z.coerce.number().int().positive().optional().nullable(),
});

export interface UpdateActionResult {
    success: boolean;
    message: string;
    error?: string;
    fieldErrors?: Record<string, string[]>;
}

// --- VVV NEW: Server Action to Update an Athlete VVV ---
export async function updateAthleteAction(
    prevState: UpdateActionResult | null,
    formData: FormData
): Promise<UpdateActionResult> {
    // 1. Authorization Check
    const user = await getAuthenticatedUserWithRole();
    if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
        return { success: false, message: "You do not have permission to edit athletes." };
    }

    // 2. Validate Form Data
    const validation = UpdateAthleteSchema.safeParse({
        athleteId: formData.get('athleteId'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dob: formData.get('dob'),
        gender: formData.get('gender'),
        nationality: formData.get('nationality') || null,
        stance: formData.get('stance') || null,
        fisNum: formData.get('fisNum') || null,
    });

    if (!validation.success) {
        return {
            success: false,
            message: "Invalid data provided.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    const { athleteId, ...athleteData } = validation.data;

    // 3. Database Update
    const pool = getDbPool();
    try {
        const updateQuery = `
            UPDATE ss_athletes
            SET first_name = $1, last_name = $2, dob = $3, gender = $4,
                nationality = $5, stance = $6, fis_num = $7
            WHERE athlete_id = $8;
        `;
        await pool.query(updateQuery, [
            athleteData.firstName,
            athleteData.lastName,
            athleteData.dob,
            athleteData.gender,
            athleteData.nationality,
            athleteData.stance,
            athleteData.fisNum,
            athleteId,
        ]);

        // 4. Revalidate and Return Success
        revalidatePath('/admin/athletes');
        return { success: true, message: "Athlete updated successfully." };

    } catch (error: any) {
        console.error("Database error updating athlete:", error);
        // Check for unique constraint violation on fis_num
        if (error.code === '23505') { // PostgreSQL unique violation code
            return { success: false, message: "Update failed: The provided FIS Number is already in use by another athlete." };
        }
        return { success: false, message: "A database error occurred." };
    }
}