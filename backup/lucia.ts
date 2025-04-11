// lib/auth/lucia.ts
import { Lucia } from "lucia";
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";
import getDbPool from "@/lib/db"; // Your Neon DB pool connection
import { cache } from "react"; // For caching user requests per request
import { cookies } from "next/headers";
import type { Session, User } from "lucia";

const pool = getDbPool();

// Use NodePostgresAdapter with your pool
const adapter = new NodePostgresAdapter(pool, {
    user: "ss_users", // YOUR user table name
    session: "auth_session", // Lucia's session table name
    // key: "auth_key", // Lucia's key table name (if using it for passwords - we aren't here)
});

export const lucia = new Lucia(adapter, {
    // Define how session IDs are stored (e.g., in cookies)
    sessionCookie: {
        name: "auth_session", // Name of the session cookie
        expires: false, // Session cookie that expires when browser closes
        attributes: {
            // set cookie attributes
            secure: process.env.NODE_ENV === "production", // Use Secure in production
            sameSite: "lax",
            path: "/",
        },
    },
    // Define attributes available on the User object (from ss_users table)
    getUserAttributes: (attributes) => {
        return {
            userId: attributes.user_id, // Map DB column to desired property name
            email: attributes.email,
            name: attributes.name,
            roleId: attributes.role_id,
            // We'll fetch role_name separately when needed to avoid storing stale data
        };
    },
    // Define attributes available on the Session object (rarely needed)
    // getSessionAttributes: (attributes) => {
    //  return {};
    // }
});

// --- IMPORTANT: Validate Session Request ---
// This pattern replaces Supabase's session handling server-side
export const validateRequest = cache(
    async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
        const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
        if (!sessionId) {
            return { user: null, session: null };
        }

        const result = await lucia.validateSession(sessionId);
        // next.js throws when you attempt to set cookie when rendering page
        try {
            if (result.session && result.session.fresh) {
                // Refresh cookie expiration
                const sessionCookie = lucia.createSessionCookie(result.session.id);
                (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
            }
            if (!result.session) {
                // Session is invalid, delete cookie
                const sessionCookie = lucia.createBlankSessionCookie();
                (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
            }
        } catch {} // Ignore errors, especially during build/static rendering

        return result;
    }
);


// Define custom User type based on Lucia and your attributes
// This helps with type safety throughout the app
declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes; // Raw attributes from DB
    }
    // Define shape of raw DB attributes Lucia will get
    interface DatabaseUserAttributes {
        user_id: number;
        email: string;
        name: string;
        role_id: number;
        // Don't include hashed_password here
    }
}