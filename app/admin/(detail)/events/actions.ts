'use server';

import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your auth helper
import { redirect } from 'next/navigation'; // If you need to redirect after deletion

interface DeleteEventResult {
    success: boolean;
    message: string;
    error?: string;
}

export async function deleteEventAction(eventId: number): Promise<DeleteEventResult> {
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required." };
    }
    const allowedRoles = ['Executive Director', 'Administrator']; // Define roles that can delete events
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to delete events." };
    }

    if (isNaN(eventId) || eventId <= 0) {
        return { success: false, message: "Invalid Event ID provided for deletion." };
    }

    console.log(`Server Action: deleteEventAction called by ${user.email} for event ID: ${eventId}`);

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Important: Consider the order of deletion due to foreign key constraints.
        // You might need to delete from child tables first if ON DELETE CASCADE is not set
        // or if you want more control.
        // Examples (these might not all apply or might have ON DELETE CASCADE):
        // await client.query('DELETE FROM ss_run_scores WHERE run_result_id IN (SELECT run_result_id FROM ss_run_results WHERE event_id = $1)', [eventId]);
        // await client.query('DELETE FROM ss_run_results WHERE event_id = $1', [eventId]);
        // await client.query('DELETE FROM ss_heat_results WHERE event_id = $1', [eventId]);
        // await client.query('DELETE FROM ss_event_registrations WHERE event_id = $1', [eventId]);
        // await client.query('DELETE FROM ss_heat_details WHERE round_id IN (SELECT round_id FROM ss_round_details WHERE event_id = $1)', [eventId]);
        // await client.query('DELETE FROM ss_round_details WHERE event_id = $1', [eventId]);
        // await client.query('DELETE FROM ss_event_divisions WHERE event_id = $1', [eventId]);
        // await client.query('DELETE FROM ss_event_judges WHERE event_id = $1', [eventId]);
        // await client.query('DELETE FROM ss_event_personnel WHERE event_id = $1', [eventId]);

        // Finally, delete the event itself
        // The CASCADE on ss_events in your schema should handle ss_event_divisions, ss_event_judges, ss_event_personnel
        // but ss_event_registrations has a FK to ss_event_divisions, so that needs to be handled if not cascaded from ss_events to ss_event_divisions then to registrations.
        // The most straightforward if your schema has proper ON DELETE CASCADE setup on FKs pointing to ss_events:
        const deleteEventResult = await client.query('DELETE FROM ss_events WHERE event_id = $1', [eventId]);

        if (deleteEventResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return { success: false, message: `Event with ID ${eventId} not found or already deleted.` };
        }

        await client.query('COMMIT');

        console.log(`Event ${eventId} deleted successfully.`);
        revalidatePath('/admin/events'); // Revalidate the admin events list
        revalidatePath('/'); // Revalidate homepage if it shows events
        revalidatePath('/events'); // If you have a public /events list page

        return { success: true, message: "Event deleted successfully." };

    } catch (error: unknown) {
        if (client) await client.query('ROLLBACK');
        console.error(`Database error deleting event ${eventId}:`, error);
        const message = error instanceof Error ? error.message : "Unknown database error.";
        return { success: false, message: `Failed to delete event: ${message}`, error: message };
    } finally {
        if (client) client.release();
    }
}