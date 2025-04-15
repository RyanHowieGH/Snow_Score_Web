// /app/admin/(standard)/events/page.tsx
// This is a Server Component - No 'use client' needed

import React from 'react'; // Import React (optional in newer Next.js but good practice)
import Link from 'next/link';
import EventList from '@/components/eventList'; // Assuming alias '@/components/' is setup
import { fetchEvents, SnowEvent } from '@/lib/data'; // Assuming alias '@/lib/' is setup
import type { Metadata } from 'next'; // For metadata

// Metadata for the page (optional but recommended)
export const metadata: Metadata = {
  title: 'Events Dashboard - Admin',
  description: 'Manage upcoming and past ski and snowboard events.',
};

// Optional: Set revalidation interval if needed
// export const revalidate = 3600; // Revalidate data every hour

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
        // Use a Fragment <>...</> or a simple <div> if you need a single root element
        <>
            {/* Header section for this page */}
            <div className="flex flex-row items-center justify-between mb-6 px-1 md:px-0"> {/* Adjust padding if needed */}
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