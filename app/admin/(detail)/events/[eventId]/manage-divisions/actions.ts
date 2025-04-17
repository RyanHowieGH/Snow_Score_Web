// app/admin/(detail)/events/[eventId]/manage-divisions/actions.ts
'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // For authorization check

// Zod schema for validating the submitted division IDs
const UpdateDivisionsSchema = z.object({
    eventId: z.coerce.number().int().positive("Invalid Event ID."), // Get eventId from form data
    division_ids: z.preprocess(
        // Ensure input is always an array
        (val) => (Array.isArray(val) ? val : (val ? [val] : [])),
        // Validate array of strings (from checkbox values)
        z.string().array()
            // Transform strings to numbers, filtering out any parsing failures (NaN)
            .transform(ids => ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))
            // The result must be an array of valid integers (can be empty)
            .pipe(z.number({invalid_type_error: "Division IDs must be numbers."}).int().array())
    )
});

// Form state definition
export interface UpdateDivisionsFormState {
    success: boolean;
    message: string;
    error?: string; // General errors
    fieldErrors?: { // Field errors
        division_ids?: string[];
        eventId?: string[];
    };
}

// --- Server Action to Update Event Divisions ---
export async function updateEventDivisionsAction(
    prevState: UpdateDivisionsFormState | null,
    formData: FormData
): Promise<UpdateDivisionsFormState> {

    // 1. Authorization Check
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required." };
    }
    // Define roles allowed to manage event divisions
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to manage event divisions." };
    }

    // 2. Validate Form Data
    const validation = UpdateDivisionsSchema.safeParse({
        eventId: formData.get('eventId'), // Get eventId from hidden input
        division_ids: formData.getAll('division_ids'), // Get all checked division IDs
    });

    // Handle validation failure
    if (!validation.success) {
        console.log("Update Divisions Validation Errors:", validation.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Invalid form data submitted.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    const { eventId, division_ids: newDivisionIdList } = validation.data; // newDivisionIdList is number[]

    // 3. Database Update (Transaction: Delete existing, Insert new)
    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Start transaction

        // 3a. Delete ALL existing division links for this specific event
        const deleteQuery = 'DELETE FROM ss_event_divisions WHERE event_id = $1';
        await client.query(deleteQuery, [eventId]);
        console.log(`Deleted existing division links for event ${eventId}.`);

        // 3b. Insert the new set of selected division links (if any were selected)
        let insertedCount = 0;
        if (newDivisionIdList.length > 0) {
            const insertDivisionsQuery = `
                INSERT INTO ss_event_divisions (event_id, division_id)
                SELECT $1, division_id_from_list
                FROM unnest($2::int[]) AS division_id_from_list
                ON CONFLICT (event_id, division_id) DO NOTHING; -- Just in case
            `;
            const insertResult = await client.query(insertDivisionsQuery, [eventId, newDivisionIdList]);
            insertedCount = insertResult.rowCount ?? 0;
            console.log(`Inserted ${insertedCount} new division links for event ${eventId}.`);
        } else {
            // If newDivisionIdList is empty, no inserts happen, effectively removing all divisions
            console.log(`No divisions selected, all links removed for event ${eventId}.`);
        }

        await client.query('COMMIT'); // Commit transaction

        // 4. Revalidate Paths to update UI
        revalidatePath(`/admin/events/${eventId}`); // Revalidate the event dashboard page
        revalidatePath(`/admin/events/${eventId}/manage-divisions`); // Revalidate this management page

        return { success: true, message: `Divisions updated successfully (${newDivisionIdList.length} assigned).` };

    } catch (error) {
        await client?.query('ROLLBACK'); // Rollback on any database error
        console.error(`Database error updating divisions for event ${eventId}:`, error);
        const message = error instanceof Error ? error.message : "Unknown database error.";
        return { success: false, message: `Database error: ${message}` };
    } finally {
        if (client) client.release(); // Ensure client is always released
    }
}