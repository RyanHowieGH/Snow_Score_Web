'use server';

import getDbPool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

export async function publishEventAction(eventId: number): Promise<{ success: boolean; message: string; }> {
  try {
    const user = await getAuthenticatedUserWithRole();
    if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
      return { success: false, message: "Unauthorized." };
    }

    if (!eventId || isNaN(eventId)) {
      return { success: false, message: "Invalid Event ID." };
    }

    const pool = getDbPool();
    const query = `
      UPDATE ss_events
      SET status = 'Scheduled'
      WHERE event_id = $1 AND status = 'Draft';
    `;
    
    const result = await pool.query(query, [eventId]);

    if (result.rowCount === 0) {
      return { success: false, message: "Event not found or already published." };
    }
    
    // Revalidate the page to show the new status
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath('/admin/events'); // Also revalidate the list page
    
    return { success: true, message: "Event published successfully!" };

  } catch (error) {
    const message = error instanceof Error ? error.message : "A database error occurred.";
    return { success: false, message };
  }
}