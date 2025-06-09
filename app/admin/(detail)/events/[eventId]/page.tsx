// /app/admin/events/page.tsx
import React from 'react';
import Link from 'next/link';
import EventList from '@/components/EventList'; // Ensure this is shared or admin specific as needed
import { fetchEvents } from '@/lib/data';
import type { SnowEvent } from '@/lib/definitions';
// REMOVE AdminHeader import from here if it's in the layout:
// import AdminHeader from '@/components/admin/AdminHeader';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Using your specified path
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

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
        // The outer div and AdminHeader are now provided by app/admin/layout.tsx
        // This component now only returns its specific content.
        <div className="space-y-6"> {/* Add a wrapper for spacing if needed */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-base-content"> {/* Changed from h2 to h1 for page title semantics */}
                    Event Management Dashboard
                </h1>
                <Link href="/admin/events/create" className="btn btn-primary mt-3 sm:mt-0">
                    Create New Event
                </Link>
            </div>

            <EventList
                events={events}
                title="" // Title is handled above in this page component
                showCreateButton={false} // Create button handled above
                baseUrl="/admin/events"
                linkActionText="Manage"
                noEventsMessage="No events found. Click 'Create New Event' to get started."
                className="space-y-6" // Keep this if EventList applies its own spacing
                itemGridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                titleTextColor="text-base-content"
            />
        </div>
    );
}