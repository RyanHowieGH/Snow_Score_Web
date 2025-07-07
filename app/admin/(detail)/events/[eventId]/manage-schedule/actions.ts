// In: app/admin/(detail)/events/[eventId]/manage-schedule/actions.ts
'use server';

import getDbPool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

export interface ScheduleFormState {
  success: boolean;
  message: string;
}

export async function updateHeatScheduleAction(
  eventId: number,
  prevState: ScheduleFormState | null,
  formData: FormData
): Promise<ScheduleFormState> {
  // Authorization check
  const user = await getAuthenticatedUserWithRole();
  if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
    return { success: false, message: "Unauthorized." };
  }

  const pool = getDbPool();
  const client = await pool.connect();
  const updates: { round_heat_id: number; start_time: string | null; end_time: string | null; }[] = [];

  // Collect all updates from the form data
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('start_time_')) {
      const round_heat_id = parseInt(key.split('_')[2], 10);
      const startTime = value.toString() || null;
      const endTime = formData.get(`end_time_${round_heat_id}`)?.toString() || null;
      updates.push({ round_heat_id, start_time: startTime, end_time: endTime });
    }
  }

  if (updates.length === 0) {
    return { success: false, message: 'No schedule data to update.' };
  }

  try {
    await client.query('BEGIN'); // Start transaction

    for (const update of updates) {
      const query = `
        UPDATE ss_heat_details
        SET start_time = $1, end_time = $2
        WHERE round_heat_id = $3;
      `;
      // Convert empty strings to null for the database
      const startTimeValue = update.start_time ? update.start_time : null;
      const endTimeValue = update.end_time ? update.end_time : null;

      await client.query(query, [startTimeValue, endTimeValue, update.round_heat_id]);
    }

    await client.query('COMMIT'); // Commit transaction

    revalidatePath(`/admin/events/${eventId}/manage-schedule`);
    return { success: true, message: 'Schedule updated successfully!' };

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error('Database Error updating schedule:', error);
    return { success: false, message: 'Failed to update schedule.' };
  } finally {
    client.release();
  }
}