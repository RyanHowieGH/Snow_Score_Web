// app\admin\(detail)\events\[eventId]\manage-schedule\actions.ts

'use server';

import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import getDbPool from '@/lib/db';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

// This is the only action result type we need for this UI
export interface ScheduleActionResult {
  success: boolean;
  message: string;
}

// Helper function for security
async function authorizeAction(): Promise<void> {
  const user = await getAuthenticatedUserWithRole();
  if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
    throw new Error("Unauthorized: You do not have permission to modify schedules.");
  }
}

/**
 * This is the only action needed for the AutoSortingSchedule component.
 * It saves the time for a specific heat AND then re-calculates the sequence
 * for ALL heats in the event based on time.
 */
export async function saveHeatTimeAndResequenceAction(
  eventId: number,
  heatId: number,
  // These are now treated as simple strings representing LOCAL time
  startTime: string | null,
  endTime: string | null
): Promise<ScheduleActionResult> {
  const client: PoolClient = await getDbPool().connect();
  try {
    await authorizeAction();
    await client.query('BEGIN');

    // --- VVV THIS IS THE FIX VVV ---
    // We no longer do any Date parsing or validation here.
    // We trust the client to send a correctly formatted string or null.
    // The database will store the literal local time string.
    await client.query(
      'UPDATE ss_heat_details SET start_time = $1, end_time = $2 WHERE round_heat_id = $3',
      [startTime, endTime, heatId]
    );
    // --- ^^^ END OF FIX ^^^ ---

    // Step 2: Fetch ALL heats for the event, now sorted by the newly updated times
    const sortedHeatsResult = await client.query(`
      SELECT hd.round_heat_id
      FROM ss_heat_details hd
      JOIN ss_round_details rd ON hd.round_id = rd.round_id
      WHERE rd.event_id = $1
      ORDER BY hd.start_time ASC NULLS LAST, rd.round_name ASC, hd.heat_num ASC;
    `, [eventId]);
    
    // Step 3: Loop through the sorted results and update their sequence number
    for (let i = 0; i < sortedHeatsResult.rows.length; i++) {
      const currentHeatId = sortedHeatsResult.rows[i].round_heat_id;
      const newSequence = i + 1; // Use 1-based sequencing for clarity
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