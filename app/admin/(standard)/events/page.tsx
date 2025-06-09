// /app/admin/events/page.tsx
import React from 'react';
import Link from 'next/link';
import EventList from '@/components/EventList'; // Ensure correct path
import { fetchEvents } from '@/lib/data';
import type { SnowEvent } from '@/lib/definitions';
import AdminHeader from '@/components/header'; // Your admin header
// import { getAuthenticatedUserWithRole } from '@/lib/auth'; // Assuming auth utilities
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Adjusted import path for user role auth

export const metadata: Metadata = {
  title: 'Manage Events - Admin Panel | SnowScore',
};

export default async function AdminEventsListPage() {
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/sign-in?redirectUrl=/admin/events');
    }

    const events = await fetchEvents();

    return (
        <div className="min-h-screen bg-base-300">
            {/* <AdminHeader /> */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Admin Page Title and Create Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-base-content">Events Dashboard</h2>
                    <Link href="/admin/events/create" className="btn btn-primary mt-3 sm:mt-0">
                        Create New Event
                    </Link>
                </div>

                {/* EventList configured for ADMIN context */}
                <EventList
                    events={events}
                    title="" // Title is handled above
                    showCreateButton={false} // Create button handled above
                    baseUrl="/admin/events"   // <<< CRUCIAL: Links will be /admin/events/[id]
                    linkActionText="Manage" // <<< CRUCIAL: Button text
                    // linkActionSuffix="/edit-details" // Optional: if you want to go directly to edit
                    noEventsMessage="No events found. Click 'Create New Event' to get started."
                    className="space-y-6"
                    itemGridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // Or your preferred admin list layout
                    titleTextColor="text-base-content" // Or specific admin theme color
                />
            </div>
        </div>
    );
}