// lib/auth/user.ts (Clerk Version)
import getDbPool from "@/lib/db";
import { PoolClient } from 'pg';
import { auth, currentUser } from '@clerk/nextjs/server';

// Define interface for our user data including role
export interface AppUserWithRole {
    authProviderId: string; // Clerk User ID
    appUserId: number;      // Your ss_users.user_id
    email: string;
    name: string;           // From ss_users
    roleId: number;
    roleName: string;
    clerkFirstName?: string | null;
    clerkLastName?: string | null;
}

// Fetches Clerk user ID, then joins DB tables
export async function getAuthenticatedUserWithRole(): Promise<AppUserWithRole | null> {
    // 1. Get authenticated Clerk user object server-side
    const authObject = await auth();
    const userId: string | null = authObject.userId;

    const clerkUser = await currentUser();

    // Check if userId is null (not authenticated)
    if (!userId) {
        return null;
    }
    if (!clerkUser) {
        console.warn(`getAuthenticatedUserWithRole: userId ${userId} exists, but currentUser() returned null.`);
         return null; // Treat as incomplete data / potential issue
    }

    const authProviderId = userId; // Use the Clerk User ID

    // 2. Query your DB
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const query = `
            SELECT
                app.auth_provider_user_id AS "authProviderId",
                app.user_id AS "appUserId",
                app.email,
                app.first_name,
                app.last_name,
                app.role_id AS "roleId",
                role.role_name AS "roleName"
            FROM ss_users app
            JOIN ss_roles role ON app.role_id = role.role_id
            WHERE app.auth_provider_user_id = $1;
        `;
        const result = await client.query(query, [authProviderId]);

        if (result.rows.length === 0) {
            console.warn(`Clerk user (ID: ${authProviderId}) is authenticated but has no corresponding linked entry in ss_users.`);
            return null;
        }

        const appData = result.rows[0];

        // Combine data
        const finalUser: AppUserWithRole = {
            authProviderId: appData.authProviderId,
            appUserId: appData.appUserId,
            email: appData.email,
            name: appData.name,
            roleId: appData.roleId,
            roleName: appData.roleName,
            clerkFirstName: clerkUser.firstName,
            clerkLastName: clerkUser.lastName,
        };

        return finalUser;

    } catch (error) {
        console.error("Error fetching application user data:", error);
        return null;
    } finally {
        if (client) client.release();
    }
}