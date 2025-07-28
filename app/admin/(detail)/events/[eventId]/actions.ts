'use server';

import getDbPool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

export async function toggleEventStatusAction(
  eventId: number,
  currentStatus: 'Active' | 'Inactive'
): Promise<{ success: boolean; message: string; newStatus?: string }> {
  try {
    const user = await getAuthenticatedUserWithRole();
    if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
      return { success: false, message: "Unauthorized." };
    }

    if (!eventId || isNaN(eventId)) {
      return { success: false, message: "Invalid Event ID." };
    }

    const pool = getDbPool();
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const query = `
      UPDATE ss_events
      SET status = $1
      WHERE event_id = $2 AND status = $3;
    `;
    const result = await pool.query(query, [newStatus, eventId, currentStatus]);

    if (result.rowCount === 0) {
      return { success: false, message: "Event not found or already in this state." };
    }
    
    // Revalidate the page to show the new status
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath('/admin/events'); // Also revalidate the list page
    
    return { success: true, message: `Event status changed to ${newStatus}.`, newStatus };

  } catch (error) {
    const message = error instanceof Error ? error.message : "A database error occurred.";
    return { success: false, message };
  }
}

// export async function publishEventAction(eventId: number): Promise<{ success: boolean; message: string; }> {
//   try {
//     const user = await getAuthenticatedUserWithRole();
//     if (!user || !['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.roleName)) {
//       return { success: false, message: "Unauthorized." };
//     }

//     if (!eventId || isNaN(eventId)) {
//       return { success: false, message: "Invalid Event ID." };
//     }

//     const pool = getDbPool();
//     const query = `
//       UPDATE ss_events
//       SET status = 'Active'
//       WHERE event_id = $1 AND status = 'Inactive';
//     `;
    
//     const result = await pool.query(query, [eventId]);

//     if (result.rowCount === 0) {
//       return { success: false, message: "Event not found or already published." };
//     }
    
//     // Revalidate the page to show the new status
//     revalidatePath(`/admin/events/${eventId}`);
//     revalidatePath('/admin/events'); // Also revalidate the list page
    
//     return { success: true, message: "Event published successfully!" };

//   } catch (error) {
//     const message = error instanceof Error ? error.message : "A database error occurred.";
//     return { success: false, message };
//   }
// }