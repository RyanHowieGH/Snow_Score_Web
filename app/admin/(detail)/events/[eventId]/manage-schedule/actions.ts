'use server';

import { z } from 'zod';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import getDbPool from '@/lib/db';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

// --- Reusable Types and Schemas ---

/**
 * A consistent return type for all schedule-related actions.
 * This provides clear feedback (success/failure and a message) to the client component.
 */
export interface ScheduleActionResult {
  success: boolean;
  message: string;
}

/**
 * Zod schema for validating the form data when adding a new round.
 * Ensures that the data sent from the client is valid before it touches the database.
 */
const AddRoundSchema = z.object({
  divisionId: z.coerce.number().int().min(1, "A division must be selected."),
  roundName: z.string().min(1, "Round name cannot be empty.").max(100, "Round name is too long."),
});


// --- Reusable Helper Functions ---

/**
 * A centralized authorization check for all actions in this file.
 * Throws an error if the current user is not authorized, which is caught by the calling action.
 * This keeps the authorization logic clean and in one place.
 */
async function authorizeAction(): Promise<void> {
  const user = await getAuthenticatedUserWithRole();
  const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
  if (!user || !allowedRoles.includes(user.roleName)) {
    throw new Error("Unauthorized: You do not have permission to modify schedules.");
  }
}


// --- Core Server Actions ---

/**
 * Updates both the start and end times for a single heat.
 * This is how implicit breaks are created and adjusted.
 */
export async function updateHeatTimesAction(
  eventId: number,
  heatId: number,
  startTime: string | null,
  endTime: string | null
): Promise<ScheduleActionResult> {
  try {
    await authorizeAction();
    const pool = getDbPool();
    const query = `UPDATE ss_heat_details SET start_time = $1, end_time = $2 WHERE round_heat_id = $3;`;
    
    // Sanitize inputs: ensure empty strings or invalid dates become null in the database.
    const startTimeValue = startTime && !isNaN(new Date(startTime).getTime()) ? startTime : null;
    const endTimeValue = endTime && !isNaN(new Date(endTime).getTime()) ? endTime : null;

    await pool.query(query, [startTimeValue, endTimeValue, heatId]);

    revalidatePath(`/admin/events/${eventId}/manage-schedule`);
    return { success: true, message: 'Heat times updated successfully.' };
  } catch (error) {
    console.error('Error in updateHeatTimesAction:', error);
    const message = error instanceof Error ? error.message : "Failed to update heat times.";
    return { success: false, message };
  }
}

/**
 * Takes the flat list of all heats and persists their new order in the database.
 * Uses a transaction to ensure all updates succeed or none do.
 */
export async function updateScheduleOrderAction(
  eventId: number,
  orderedHeatIds: number[]
): Promise<ScheduleActionResult> {
  const client: PoolClient = await getDbPool().connect();
  try {
    await authorizeAction();
    await client.query('BEGIN'); // Start a transaction for this multi-step operation

    for (let i = 0; i < orderedHeatIds.length; i++) {
      const heatId = orderedHeatIds[i];
      const newSequence = i;
      await client.query(
        'UPDATE ss_heat_details SET schedule_sequence = $1 WHERE round_heat_id = $2',
        [newSequence, heatId]
      );
    }

    await client.query('COMMIT'); // Commit all updates at once
    revalidatePath(`/admin/events/${eventId}/manage-schedule`);
    return { success: true, message: 'Schedule order saved successfully!' };
  } catch (error) {
    await client.query('ROLLBACK'); // Abort all changes if any step fails
    console.error('Error in updateScheduleOrderAction:', error);
    const message = error instanceof Error ? error.message : "Database error while reordering schedule.";
    return { success: false, message };
  } finally {
    // IMPORTANT: Always release the client back to the pool in a finally block.
    client.release();
  }
}


/**
 * Deletes a single heat from the schedule.
 */
export async function deleteHeatAction(
    eventId: number,
    heatId: number
): Promise<ScheduleActionResult> {
  try {
    await authorizeAction();
    const pool = getDbPool();
    await pool.query("DELETE FROM ss_heat_details WHERE round_heat_id = $1", [heatId]);

    revalidatePath(`/admin/events/${eventId}/manage-schedule`);
    return { success: true, message: "Heat deleted." };
  } catch (error) {
    console.error('Error in deleteHeatAction:', error);
    const message = error instanceof Error ? error.message : "Failed to delete heat.";
    return { success: false, message };
  }
}

// NOTE: The actions below (add/delete rounds/heats) would be called from a separate
// modal or form UI, not directly from the draggable list itself. They are included here
// for completeness of the schedule management feature.

/**
 * Adds a new round to an event.
 * Note: Since rounds are no longer on the draggable timeline, this action
 * simply creates the round. Heats must be added to it separately.
 */
export async function addRoundAction(
    eventId: number,
    formData: FormData
): Promise<ScheduleActionResult> {
    try {
        await authorizeAction();
        const validation = AddRoundSchema.safeParse({
            divisionId: formData.get('divisionId'),
            roundName: formData.get('roundName')
        });

        if (!validation.success) {
            const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, message: firstError || 'Invalid input.' };
        }
        const { divisionId, roundName } = validation.data;
        
        const pool = getDbPool();
        const insertQuery = `INSERT INTO ss_round_details (event_id, division_id, round_name) VALUES ($1, $2, $3);`;
        await pool.query(insertQuery, [eventId, divisionId, roundName]);
        
        revalidatePath(`/admin/events/${eventId}/manage-schedule`);
        return { success: true, message: `Round "${roundName}" has been added.` };
    } catch (error) {
        console.error('Error in addRoundAction:', error);
        const message = error instanceof Error ? error.message : "Failed to add round.";
        return { success: false, message };
    }
}

/**
 * Adds a new heat to a specific round, placing it at the end of the schedule sequence.
 */
export async function addHeatAction(
    eventId: number,
    roundId: number
): Promise<ScheduleActionResult> {
    const client = await getDbPool().connect();
    try {
        await authorizeAction();
        await client.query('BEGIN');

        // Get the next display number for this heat (e.g., Heat #4)
        const heatNumResult = await client.query('SELECT COALESCE(MAX(heat_num), 0) + 1 as next_num FROM ss_heat_details WHERE round_id = $1', [roundId]);
        const nextHeatNum = heatNumResult.rows[0].next_num;

        // Get the next sequence number for the entire schedule
        const seqResult = await client.query('SELECT COALESCE(MAX(schedule_sequence), -1) + 1 as next_seq FROM ss_heat_details WHERE round_id IN (SELECT round_id FROM ss_round_details WHERE event_id = $1)', [eventId]);
        const nextSequence = seqResult.rows[0].next_seq;

        const insertQuery = `INSERT INTO ss_heat_details (round_id, heat_num, schedule_sequence, num_runs) VALUES ($1, $2, $3, 3);`;
        await client.query(insertQuery, [roundId, nextHeatNum, nextSequence]);
        
        await client.query('COMMIT');
        revalidatePath(`/admin/events/${eventId}/manage-schedule`);
        return { success: true, message: `Heat #${nextHeatNum} added.` };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in addHeatAction:', error);
        const message = error instanceof Error ? error.message : "Failed to add heat.";
        return { success: false, message };
    } finally {
        client.release();
    }
}

/**
 * Deletes a round and all of its associated heats (due to ON DELETE CASCADE in the database).
 */
export async function deleteRoundAction(
    eventId: number,
    roundId: number
): Promise<ScheduleActionResult> {
  try {
    await authorizeAction();
    const pool = getDbPool();
    await pool.query("DELETE FROM ss_round_details WHERE round_id = $1 AND event_id = $2", [roundId, eventId]);

    revalidatePath(`/admin/events/${eventId}/manage-schedule`);
    return { success: true, message: "Round and its heats have been deleted." };
  } catch (error) {
    console.error('Error in deleteRoundAction:', error);
    const message = error instanceof Error ? error.message : "Failed to delete round.";
    return { success: false, message };
  }
}