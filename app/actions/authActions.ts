// app/actions/authActions.ts (Example location for shared auth actions)
'use server';

import { lucia, validateRequest } from '@/lib/auth/lucia';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout(): Promise<{ success: boolean; error?: string }> {
    // Validate the current session
    const { session } = await validateRequest();
    if (!session) {
        // Already logged out or invalid session
        return { success: false, error: "Not authenticated" };
    }

    try {
        // Invalidate the session in the database
        await lucia.invalidateSession(session.id);

        // Create a blank cookie to clear the browser's session cookie
        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        console.log(`Session invalidated: ${session.id}`);
        return { success: true };

    } catch (error) {
        console.error("Logout error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Logout failed: ${message}` };
    }

     // Optional: Redirect after logout
     // redirect('/login');
}