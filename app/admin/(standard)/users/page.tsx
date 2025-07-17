// app/admin/users/page.tsx
import React from 'react';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import CreateUserForm from './CreateUserForm';
import getDbPool from '@/lib/db';
import UserList from './UserList'; // <-- IMPORT THE NEW COMPONENT
import { fetchUsersWithRoles } from '@/lib/data'; // <-- IMPORT THE NEW FETCH FUNCTION

// Fetch available roles server-side
async function getRoles() {
    // IMPORTANT: Filter roles based on what the *current admin* is allowed to assign
    const user = await getAuthenticatedUserWithRole();
    if (!user) return []; // Should be protected by layout/middleware anyway

    // Example: Admins can assign roles below Admin, Exec Dir can assign anything below Exec Dir
    let maxAssignableRoleId = 0;
    if (user.roleName === 'Executive Director') maxAssignableRoleId = 1; // Can assign Admin, CoC etc.
    else if (user.roleName === 'Administrator') maxAssignableRoleId = 2; // Can assign CoC, TD etc.
     else if (user.roleName === 'Chief of Competition') maxAssignableRoleId = 3; // Can assign TD, HJ etc.
    // Add other roles

    const pool = getDbPool();
    try {
        const result = await pool.query('SELECT role_id, role_name FROM ss_roles WHERE role_id > $1 ORDER BY role_id ASC', [maxAssignableRoleId]);
        return result.rows;
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        return [];
    }
}


export default async function ManageUsersPage() {
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin');
    }

    const assignableRoles = await getRoles();
    const existingUsers = await fetchUsersWithRoles(); // <-- FETCH THE USERS

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Manage Users</h2>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">Create New User</h3>
                    <p className="text-sm opacity-70">
                        Creates a user account in the authentication system. An invitation or password setup email will be sent by Clerk. The user will be assigned the selected role in this application via the webhook.
                    </p>
                    <CreateUserForm assignableRoles={assignableRoles} />
                </div>
            </div>

            <div className="card bg-base-100 shadow mt-6">
                <div className="card-body">
                    <h3 className="card-title">Existing Users</h3>
                    {/* --- VVV IMPLEMENTED USER LIST VVV --- */}
                    <UserList users={existingUsers} currentUserId={user.appUserId} />
                </div>
            </div>
        </div>
    );
}