// lib/auth/user.ts (Neon Auth + Stytch Version)
import getDbPool from "@/lib/db";
import { PoolClient } from 'pg';
import { cookies } from "next/headers"; // To read session cookies
import { getStytchServerClient } from "@/lib/stytch/serverClient"; // Import backend client

// Define interface for our user data including role
export interface AppUserWithRole {
    authProviderId: string; // Stytch User ID (from neon_auth.users_sync.id)
    appUserId: number;      // Your ss_users.user_id
    email: string;
    name: string;           // From ss_users (or neon_auth?)
    roleId: number;
    roleName: string;
}

// Helper to validate Stytch session server-side and return Stytch User ID
async function getCurrentAuthProviderId(): Promise<string | null> {
    const stytchClient = getStytchServerClient();
    // Try JWT first (more stateless), then opaque token
    const sessionJwt = cookies().get('stytch_session_jwt')?.value;
    const sessionToken = cookies().get('stytch_session')?.value; // Opaque token

    if (!sessionJwt && !sessionToken) {
        // console.log("getCurrentAuthProviderId: No Stytch session cookie found.");
        return null;
    }

    try {
        // Prefer JWT authentication if available
        if (sessionJwt) {
            // console.log("getCurrentAuthProviderId: Authenticating with JWT...");
            const { session } = await stytchClient.sessions.authenticateJwt(sessionJwt, {
                 // Optionally set max_token_age_seconds if needed
            });
            // console.log("getCurrentAuthProviderId: JWT valid for user:", session.user_id);
            return session.user_id;
        }
        // Fallback to opaque token authentication
        if (sessionToken) {
             console.log("getCurrentAuthProviderId: Authenticating with Opaque Token...");
             const { session } = await stytchClient.sessions.authenticate({ session_token: sessionToken });
             console.log("getCurrentAuthProviderId: Opaque Token valid for user:", session.user_id);
             return session.user_id;
        }
        return null; // Should not be reached if one of the cookies existed
    } catch (error: any) {
         // Handle specific errors like session not found or expired
         if (error?.status_code === 404 || error?.status_code === 401) {
              console.log("getCurrentAuthProviderId: Session invalid or expired.");
         } else {
              console.error("Stytch session validation error:", error);
         }
        return null;
    }
}


// Fetches Stytch user ID, then joins DB tables
export async function getAuthenticatedUserWithRole(): Promise<AppUserWithRole | null> {
    const authProviderId = await getCurrentAuthProviderId(); // Get current user's Stytch ID

    if (!authProviderId) {
        return null; // Not authenticated
    }

    // Query DB joining neon_auth, ss_users, and ss_roles
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        // Query relies on ss_users.auth_provider_user_id being populated correctly
        const query = `
            SELECT
                sync.id AS "authProviderId",
                app.user_id AS "appUserId",
                app.email, -- Using app email
                app.name,  -- Using app name
                app.role_id AS "roleId",
                role.role_name AS "roleName"
            FROM ss_users app
            JOIN ss_roles role ON app.role_id = role.role_id
            -- Optional: LEFT JOIN in case neon_auth sync is delayed, but we need ss_users link
            LEFT JOIN neon_auth.users_sync sync ON app.auth_provider_user_id = sync.id
            WHERE app.auth_provider_user_id = $1 AND (sync.deleted_at IS NULL OR sync.id IS NULL);
            -- Filter by auth ID and ensure synced user isn't deleted (or allow if sync is missing)
        `;
        const result = await client.query(query, [authProviderId]);

        if (result.rows.length === 0) {
            console.warn(`Authenticated Stytch user (ID: ${authProviderId}) has no corresponding linked entry in ss_users.`);
            // This indicates a potential issue with the user creation/linking flow.
            return null;
        }

        return result.rows[0] as AppUserWithRole;

    } catch (error) {
        console.error("Error fetching user data with role:", error);
        // Check if neon_auth schema exists error
        if (error instanceof Error && error.message.includes('relation "neon_auth.users_sync" does not exist')) {
             console.error("CRITICAL: neon_auth.users_sync table not found. Ensure Neon Auth is configured correctly.");
        }
        return null;
    } finally {
        if (client) client.release();
    }
}