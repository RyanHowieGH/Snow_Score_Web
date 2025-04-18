// app/admin/users/page.tsx
import React from 'react';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import CreateUserForm from './CreateUserForm';
import getDbPool from '@/lib/db';

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
    // --- Page Level Authorization Check ---
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition']; // Roles allowed to VIEW this page
    if (!user || !allowedRoles.includes(user.roleName)) {
        // Redirect if user is not logged in or doesn't have permission
        // Although middleware might already handle the logged-out case
        console.log(`User ${user?.email} with role ${user?.roleName} denied access to /admin/users`);
        redirect('/admin'); // Or redirect to an '/unauthorized' page
    }
    // --- End Authorization Check ---

    const assignableRoles = await getRoles(); // Fetch roles the current user can assign

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Manage Users</h2>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">Create New User</h3>
                    <p className="text-sm opacity-70">
                        Creates a user account in the authentication system. An invitation or password setup email will be sent by Clerk. The user will be assigned the selected role in this application via the webhook.
                    </p>
                    {/* Pass assignable roles to the form */}
                    <CreateUserForm assignableRoles={assignableRoles} />
                </div>
            </div>

            <div className="card bg-base-100 shadow mt-6">
                 <div className="card-body">
                      <h3 className="card-title">Existing Users</h3>
                      {/* TODO: Implement UserList component here */}
                      <p className='italic text-sm'>User list and role editing/deletion coming soon...</p>
                      {/* <UserList currentUserRole={user.roleName} /> */}
                 </div>
            </div>
        </div>
    );
}