// /app/admin/(standard)/events/page.tsx
// This is a Server Component - No 'use client' needed

import React from 'react';
import Link from 'next/link';
import EventList from '@/components/EventList';
import { fetchEvents } from '@/lib/data';
import type { SnowEvent } from '@/components/eventListItem';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events Dashboard - Admin',
  description: 'Manage upcoming and past ski and snowboard events.',
};


// The Page component - async because it fetches data
export default async function EventsListPage() {
    // Fetch events data directly on the server before rendering
    console.log("Fetching events for /admin/events page...");
    const events: SnowEvent[] = await fetchEvents();
    console.log(`Fetched ${events.length} events.`);

    // This component should ONLY return the content specific to this page.
    // The layout structure (Header, Sidebar, main tag) is provided by
    // the layout file in the route group: /app/admin/(standard)/layout.tsx
    return (
        <>
            {/* Header section for this page */}
            <div className="flex flex-row items-center justify-between mb-6 px-1 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold">Events Dashboard</h2>
                {/* Button to navigate to the event creation page */}
                <Link href="/admin/events/create" className="btn btn-primary">
                    Create Event
                </Link>
            </div>

            {/* Render the EventList component, passing the fetched events */}
            <EventList events={events} />
        </>
    );
}