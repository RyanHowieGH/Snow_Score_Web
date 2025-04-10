// app/login/actions.ts
'use server';

import { z } from 'zod';
import { lucia } from '@/lib/auth/lucia';
import { verifyPassword } from '@/lib/auth/password';
import getDbPool from '@/lib/db';
// Import the 'cookies' function itself
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // Optional

const LoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password cannot be empty"),
});

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function login(credentials: unknown): Promise<ActionResult> {
    const validation = LoginSchema.safeParse(credentials);
    if (!validation.success) {
        return { success: false, error: "Invalid email or password format." };
    }
    const { email, password } = validation.data;

    const pool = getDbPool();
    let client = null;

    try {
        // --- Assuming you store/verify password against ss_users.hashed_password ---
        // (Adjust if verifying against auth_key.hashed_password instead)
        client = await pool.connect();
        const userQuery = 'SELECT user_id, email, hashed_password FROM ss_users WHERE LOWER(email) = LOWER($1)'; // Use LOWER for case-insensitive lookup
        const userResult = await client.query(userQuery, [email]);

        if (userResult.rows.length === 0) { /* ... user not found ... */ return { success: false, error: "Incorrect email or password." }; }
        const user = userResult.rows[0];
        if (!user.hashed_password) { /* ... no password ... */ return { success: false, error: "Account configuration error." }; }

        const isValidPassword = await verifyPassword(user.hashed_password, password);
        if (!isValidPassword) { /* ... invalid password ... */ return { success: false, error: "Incorrect email or password." }; }
        // --- End password verification ---


        // --- Create session and cookie ---
        const session = await lucia.createSession(user.user_id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        // --- AWAIT cookies() call before using .set() ---
        const cookieStore = cookies(); // Get the cookie store instance
        (await cookieStore).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        // --- END AWAIT ---

        console.log(`Login successful for ${email}, session created: ${session.id}`);
        return { success: true };

    } catch (error) {
        // ... error handling ...
         console.error("Login action error:", error);
         const message = error instanceof Error ? error.message : "An unknown error occurred.";
         return { success: false, error: `Login failed: ${message}` };
    } finally {
        if (client) client.release();
    }
}