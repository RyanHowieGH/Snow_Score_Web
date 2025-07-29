// /app/admin/(standard)/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
// Import useAuth if you want conditional links/welcome message
import { useAuth } from '@/components/ClientSideAuthWrapper';

export default function AdminDashboardPage() {
    const user = useAuth();

    // Check user role for conditional rendering
    const canManageUsers = user && ['Executive Director', 'Administrator', 'Head Judge'].includes(user.role_name);
    const canManageEvents = user && ['Executive Director', 'Administrator', 'Chief of Competition', 'Head Judge'].includes(user.role_name);

    return (
        <div className="flex flex-col items-center justify-center pt-10">
            <h2 className="
                 font-bold 
                 mb-4
                 text-3xl
                 s256:text-xs
                 s384:text-sm
                 s576:text-base
                 md:text-lg
                 lg:text-xl
                 xl:text-2xl
                 2xl:text-3xl
                 3xl:text-4xl">Admin Dashboard</h2>
            <p className="
                 text-lg 
                 mb-8
                 s256:text-xs
                 s384:text-sm
                 s576:text-base
                 md:text-lg
                 lg:text-xl
                 xl:text-2xl
                 2xl:text-3xl
                 3xl:text-4xl">
                 Welcome, {user?.app_user_name || 'Admin'}! Manage your events and athletes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                 {/* Link to the Events List page */}
                 {canManageEvents && ( // Add this check
                 <Link href="/admin/events" 
                 className="
                 btn 
                 btn-lg 
                 btn-accent
                 text-base
                 s256:text-xs
                 s384:text-sm
                 s576:text-base
                 md:text-lg
                 lg:text-xl
                 xl:text-2xl
                 2xl:text-3xl
                 3xl:text-4xl">Events</Link>
                 )}
                 {/* Conditionally show Users link */}
                 {canManageUsers && (
                     <Link href="/admin/users" className="
                 btn 
                 btn-lg 
                 btn-accent
                 text-base
                 s256:text-xs
                 s384:text-sm
                 s576:text-base
                 md:text-lg
                 lg:text-xl
                 xl:text-2xl
                 2xl:text-3xl
                 3xl:text-4xl">Users</Link>
                 )}

                  {/* Link to Athletes page */}
                 <Link href="/admin/athletes" className="
                 btn 
                 btn-lg 
                 btn-accent
                 text-base
                 s256:text-xs
                 s384:text-sm
                 s576:text-base
                 md:text-lg
                 lg:text-xl
                 xl:text-2xl
                 2xl:text-3xl
                 3xl:text-4xl">Athletes</Link>
            </div>
        </div>
    );
}