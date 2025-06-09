// lib/auth/user.ts (Clerk Version)
import getDbPool from "@/lib/db";
import { PoolClient } from 'pg';
import { auth, currentUser } from '@clerk/nextjs/server';

export interface AppUserWithRole {
    authProviderId: string;
    appUserId: number;
    email: string;
    name: string; // This will be a constructed full name
    firstName: string; // From ss_users.first_name
    lastName: string;  // From ss_users.last_name
    roleId: number;
    roleName: string;
    clerkId: string; // Added for clarity, same as authProviderId
    clerkFirstName?: string | null;
    clerkLastName?: string | null;
    // Add any other fields from ss_users you might need
}

export async function getAuthenticatedUserWithRole(): Promise<AppUserWithRole | null> {
    const authResult = await auth(); // Correctly awaited
    const clerkUserIdFromAuth = authResult.userId;

    if (!clerkUserIdFromAuth) {
        console.log("getAuthenticatedUserWithRole: No Clerk userId found in auth object. User not authenticated.");
        return null;
    }

    // currentUser() can also provide details if needed, but auth().userId is primary for linking
    const clerkUserDetails = await currentUser();
    if (!clerkUserDetails) {
        // This can happen if the session is valid but Clerk has an issue fetching full user details,
        // or if called in a context where currentUser() isn't fully populated.
        // We already have clerkUserIdFromAuth, so we can proceed if ss_users linking is the main goal.
        console.warn(`getAuthenticatedUserWithRole: currentUser() returned null for Clerk ID: ${clerkUserIdFromAuth}. Proceeding with ID only.`);
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const query = `
            SELECT
                app.user_id AS "appUserId",
                app.email,
                app.first_name AS "firstName", -- Alias to match expected property
                app.last_name AS "lastName",   -- Alias to match expected property
                app.role_id AS "roleId",
                role.role_name AS "roleName"
            FROM ss_users app
            JOIN ss_roles role ON app.role_id = role.role_id
            WHERE app.auth_provider_user_id = $1;
        `;
        const result = await client.query(query, [clerkUserIdFromAuth]);

        if (result.rows.length === 0) {
            console.warn(`getAuthenticatedUserWithRole: Clerk user (ID: ${clerkUserIdFromAuth}) has no corresponding entry in ss_users.`);
            return null;
        }

        const appData = result.rows[0];

        // Construct the full name
        const fullName = [appData.firstName, appData.lastName].filter(Boolean).join(' ').trim();

        const finalUser: AppUserWithRole = {
            authProviderId: clerkUserIdFromAuth, // Use the ID from auth()
            appUserId: appData.appUserId,
            email: appData.email,
            name: fullName || appData.email, // Fallback to email if name is empty
            firstName: appData.firstName,
            lastName: appData.lastName,
            roleId: appData.roleId,
            roleName: appData.roleName,
            clerkId: clerkUserIdFromAuth, // Storing Clerk's own user ID
            clerkFirstName: clerkUserDetails?.firstName || null,
            clerkLastName: clerkUserDetails?.lastName || null,
        };
        console.log("getAuthenticatedUserWithRole: Successfully fetched user:", finalUser.email, "Role:", finalUser.roleName);
        return finalUser;

    } catch (error) {
        console.error("getAuthenticatedUserWithRole: Database error:", error);
        return null;
    } finally {
        if (client) client.release();
    }
}