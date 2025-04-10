// lib/auth/user.ts (Neon Auth Version)
import getDbPool from "@/lib/db";
import { PoolClient } from 'pg';
// Import hook from your chosen auth provider SDK to get the current user ID server-side
// This depends HEAVILY on the specific provider SDK (Stytch, Clerk, etc.)
// Example placeholder - REPLACE with actual SDK method:
// import { getUserIdFromServer } from '@stytch/nextjs/server'; // HYPOTHETICAL

// We need a way to get the *current authenticated user's ID* on the server.
// Clerk: auth().userId
// Stytch: Often involves validating a session token passed from client or stored server-side.
// Let's assume a function `getCurrentAuthProviderId()` exists that securely gets the ID.

// --- Placeholder - Needs implementation based on your Auth Provider SDK ---
async function getCurrentAuthProviderId(): Promise<string | null> {
     // This function needs to securely get the authenticated user's ID (the one stored in neon_auth.users_sync.id)
     // For Stytch, it might involve validating a session JWT from cookies.
     // For Clerk, it's often simpler like `const { userId } = auth();`
     // CONSULT YOUR AUTH PROVIDER'S SERVER-SIDE SDK DOCUMENTATION.
     console.warn("Placeholder function getCurrentAuthProviderId() called. Needs implementation!");

     // --- Example using Stytch session validation (needs setup) ---
     /*
     import { cookies } from 'next/headers';
     import { stytchClient } from './stytchServerClient'; // Need to create this server client

     const sessionToken = cookies().get('stytch_session')?.value; // Or 'stytch_session_jwt'
     if (!sessionToken) return null;
     try {
         const { session } = await stytchClient.sessions.authenticate({ session_token: sessionToken });
         return session.user_id; // This is the Stytch User ID
     } catch (error) {
         console.error("Stytch session validation error:", error);
         return null;
     }
     */
     return null; // Default to null until implemented
}
// --- End Placeholder ---


// Define interface for our user data including role
export interface AppUserWithRole {
    authProviderId: string; // ID from neon_auth.users_sync / Stytch / Clerk etc.
    appUserId: number; // ID from ss_users
    email: string;
    name: string; // From ss_users (or neon_auth?) - decide source of truth
    roleId: number;
    roleName: string;
}

// Fetches data from neon_auth.users_sync and joins with ss_users/ss_roles
export async function getAuthenticatedUserWithRole(): Promise<AppUserWithRole | null> {
    const authProviderId = await getCurrentAuthProviderId(); // Get current user's external ID

    if (!authProviderId) {
        return null; // Not authenticated according to provider SDK
    }

    // Query DB joining neon_auth, ss_users, and ss_roles
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const query = `
            SELECT
                sync.id AS "authProviderId",
                app.user_id AS "appUserId",
                app.email, -- Or sync.email? Decide source of truth
                app.name,  -- Or sync.name? Decide source of truth
                app.role_id AS "roleId",
                role.role_name AS "roleName"
            FROM neon_auth.users_sync sync
            JOIN ss_users app ON sync.id = app.auth_provider_user_id
            JOIN ss_roles role ON app.role_id = role.role_id
            WHERE sync.id = $1 AND sync.deleted_at IS NULL; -- Check ID and ensure not deleted
        `;
        const result = await client.query(query, [authProviderId]);

        if (result.rows.length === 0) {
            console.warn(`User found in Auth Provider (ID: ${authProviderId}) but linkage missing or user deleted in neon_auth/ss_users.`);
            // This might happen briefly due to sync delay or if ss_users entry wasn't created.
            return null;
        }

        return result.rows[0] as AppUserWithRole;

    } catch (error) {
        console.error("Error fetching user data with role:", error);
        return null;
    } finally {
        if (client) client.release();
    }
}