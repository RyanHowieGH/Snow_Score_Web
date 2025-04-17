// app/admin/(standard)/athletes/actions.ts
'use server';

import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { z } from 'zod'; // Import Zod (ZodError not needed)

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
        // Note: This relies on the error object structure from 'pg'
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const pgErrorCode = String(error.code); // Convert code to string for comparison
            errorCode = pgErrorCode; // Store the actual code

            // Check for Foreign Key violation (Postgres code '23503')
            if (pgErrorCode === '23503') {
                userMessage = "Cannot delete athlete: They are likely registered for an event or have associated results.";
                console.warn(`Deletion of athlete ID ${athleteId} failed due to foreign key constraint.`);
            } else if (error instanceof Error) {
                 // If it has a code but isn't FK, maybe use the general message
                 // userMessage = `Database error (${pgErrorCode}): ${error.message}`; // Avoid exposing too much detail
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