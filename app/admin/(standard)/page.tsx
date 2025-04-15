// /app/admin/(standard)/page.tsx (or .js) - Corrected Links
'use client';

import React from 'react';
import Link from 'next/link';
// Import useAuth if you want conditional links/welcome message
import { useAuth } from '@/components/ClientSideAuthWrapper';

export default function AdminDashboardPage() {
    // Get user from context if needed for conditional rendering
    const user = useAuth();

    // Check user role for conditional rendering (Example)
    const canManageUsers = user && ['Executive Director', 'Administrator'].includes(user.role_name);
    const canManageEvents = user && ['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.role_name);


    return (
        <div className="flex flex-col items-center justify-center pt-10">
            <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
            <p className="text-lg mb-8">
                 {/* Example: Display user name from context */}
                 Welcome, {user?.app_user_name || 'Admin'}! Manage your events and athletes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                 {/* Link to the Events List page */}
                 <Link href="/admin/events" className="btn btn-lg btn-accent">Events</Link>

                 {/* Conditionally show Users link */}
                 {canManageUsers && (
                     <Link href="/admin/users" className="btn btn-lg btn-accent">Users</Link>
                 )}

                  {/* Link to Athletes page (assuming it will live under /admin/(standard)/athletes eventually) */}
                 <Link href="/admin/athletes" className="btn btn-lg btn-accent">Athletes</Link>
            </div>
        </div>
    );
}