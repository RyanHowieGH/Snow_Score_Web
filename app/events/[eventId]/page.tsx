// app/events/[eventId]/page.tsx
import React from 'react';
import { fetchEventById, formatDateRange } from '@/lib/data'; // Keep imports for page
import BlankHeader from '@/components/blankHeader';
import { notFound } from 'next/navigation';

type PageContextProps = {
    params: { eventId: string };
    searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function EventDetailsPage({ params }: PageContextProps) {
    // ... (page logic remains the same)
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) { notFound(); }
    const event = await fetchEventById(eventId);
    if (!event) { notFound(); }
    const formattedDate = formatDateRange(event.start_date, event.end_date);
    return (
        <main>
            <BlankHeader />
            <div className="container mx-auto px-4 py-8">
                {/* ... content ... */}
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary">{event.name}</h1>
                <p>{event.location}</p>
                <p>{formattedDate}</p>
                {/* ... etc ... */}
            </div>
        </main>
    );
}

// Radically simplify generateMetadata
export async function generateMetadata({ params }: PageContextProps): Promise<{ title: string }> { // Explicit Promise return type for metadata
    const eventId = params.eventId; // Just access it, no Number conversion yet
    // console.log("Metadata eventId:", eventId); // For local debugging
    return {
        title: `Event ${eventId}`, // Simplest possible dynamic title
    };
}