'use server';

import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import getDbPool from '@/lib/db';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

export interface ScheduleActionResult {
  success: boolean;
  message: string;
}

async function authorizeAction(): Promise<void> {
  const user = await getAuthenticatedUserWithRole();
  if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
    throw new Error("Unauthorized: You do not have permission to modify schedules.");
  }
}

/**
 * This is the new core action. It saves the time for a specific heat
 * AND then re-calculates the sequence for ALL heats in the event based on time.
 * This ensures the order is always correct and persistent.
 */
export async function saveHeatTimeAndResequenceAction(
  eventId: number,
  heatId: number,
  startTime: string | null,
  endTime: string | null
): Promise<ScheduleActionResult> {
  const client: PoolClient = await getDbPool().connect();
  try {
    await authorizeAction();
    await client.query('BEGIN'); // Start transaction for data integrity

    // Step 1: Update the specific heat's times
    const startTimeValue = startTime && !isNaN(new Date(startTime).getTime()) ? startTime : null;
    const endTimeValue = endTime && !isNaN(new Date(endTime).getTime()) ? endTime : null;
    await client.query(
      'UPDATE ss_heat_details SET start_time = $1, end_time = $2 WHERE round_heat_id = $3',
      [startTimeValue, endTimeValue, heatId]
    );

    // Step 2: Fetch ALL heats for the event, now sorted by the newly updated times
    const sortedHeatsResult = await client.query(`
      SELECT hd.round_heat_id
      FROM ss_heat_details hd
      JOIN ss_round_details rd ON hd.round_id = rd.round_id
      WHERE rd.event_id = $1
      ORDER BY hd.start_time ASC NULLS LAST, rd.round_name ASC, hd.heat_num ASC;
    `, [eventId]);
    
    // Step 3: Loop through the sorted results and update their sequence
    for (let i = 0; i < sortedHeatsResult.rows.length; i++) {
      const currentHeatId = sortedHeatsResult.rows[i].round_heat_id;
      const newSequence = i;
      await client.query(
        'UPDATE ss_heat_details SET schedule_sequence = $1 WHERE round_heat_id = $2',
        [newSequence, currentHeatId]
      );
    }
    
    await client.query('COMMIT'); // Commit all changes
    revalidatePath(`/admin/events/${eventId}/manage-schedule`);
    return { success: true, message: 'Schedule updated and re-sorted.' };
  } catch (error) {
    await client.query('ROLLBACK'); // Abort on any error
    console.error('Error in saveHeatTimeAndResequenceAction:', error);
    const message = error instanceof Error ? error.message : "Failed to update schedule.";
    return { success: false, message };
  } finally {
    client.release();
  }
}

// Add/Delete actions for rounds/heats can remain here if needed for other UI elements.
// They would be called from a separate "Add Heat" modal, for example.