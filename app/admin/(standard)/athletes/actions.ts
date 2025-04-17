// app/admin/(standard)/athletes/actions.ts
'use server';

import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { ZodError, z } from 'zod'; // Import Zod

// Simple schema to validate the ID is a positive integer
const AthleteIdSchema = z.coerce.number().int().positive("Invalid Athlete ID.");

// Define return type for the action
interface DeleteActionResult {
    success: boolean;
    message: string; // User-friendly message
    error?: string;   // Optional technical error detail or code
}

// --- Server Action to Delete an Athlete ---
export async function deleteAthleteAction(athleteIdInput: unknown): Promise<DeleteActionResult> {

    // 1. Authorization Check: Who can delete athletes?
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required.", error: "Unauthorized" };
    }
    // Adjust roles allowed to delete as needed
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
        // Attempt to delete the athlete
        const deleteQuery = `DELETE FROM ss_athletes WHERE athlete_id = $1`;
        const result = await client.query(deleteQuery, [athleteId]);

        // Check if a row was actually deleted
        if (result.rowCount === 1) {
            console.log(`Successfully deleted athlete ID: ${athleteId}`);
            // Revalidate the athletes list page cache
            revalidatePath('/admin/athletes');
            return { success: true, message: "Athlete deleted successfully." };
        } else {
            // No rows deleted - athlete ID likely didn't exist
            console.warn(`Attempted to delete athlete ID ${athleteId}, but no rows were affected.`);
            return { success: false, message: "Athlete not found or already deleted.", error: "Not Found" };
        }

    } catch (error: any) {
        // Handle potential database errors
        console.error(`Database error deleting athlete ID ${athleteId}:`, error);
        let userMessage = "Could not delete athlete due to a database error.";
        // Check for Foreign Key violation error (Postgres error code 23503)
        if (error.code === '23503') {
            userMessage = "Cannot delete athlete: They are likely registered for an event or have associated results.";
            console.warn(`Deletion of athlete ID ${athleteId} failed due to foreign key constraint.`);
        } else if (error instanceof Error){
             // Include DB message only if needed for specific debugging, avoid exposing details generally
             // userMessage = `Database error: ${error.message}`;
        }
        return { success: false, message: userMessage, error: error.code || 'DB Error' };
    } finally {
        // Ensure the database client is always released
        if (client) client.release();
    }
}