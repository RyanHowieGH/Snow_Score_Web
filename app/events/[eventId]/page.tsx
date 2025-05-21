// app/events/[eventId]/page.tsx
import React from 'react';
import { fetchEventById, formatDateRange } from '@/lib/data';
import BlankHeader from '@/components/blankHeader';
import { notFound } from 'next/navigation';

// Define a type that includes searchParams, even if not used in this specific page's logic
type PageContextProps = {
    params: { eventId: string };
    searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function EventDetailsPage({ params }: PageContextProps) { // Use the new type
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) {
        notFound();
    }

    const event = await fetchEventById(eventId);

    if (!event) {
        notFound();
    }

    const formattedDate = formatDateRange(event.start_date, event.end_date);

    return (
        <main>
            <BlankHeader />
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-100 shadow-xl rounded-lg p-6 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary">
                        {event.name}
                    </h1>
                    <p className="text-lg text-base-content opacity-80 mb-4">
                        {event.location}
                    </p>
                    <div className="mb-6 border-b pb-4">
                        <p className="text-md font-semibold text-base-content">
                            Dates:
                            <span className="font-normal ml-2">
                                {formattedDate}
                            </span>
                        </p>
                    </div>
                    {event.divisions && event.divisions.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2 text-secondary">Divisions</h2>
                            <ul className="list-disc list-inside space-y-1">
                                {event.divisions.map((division) => (
                                    <li key={division.division_id} className="text-base-content">
                                        {division.division_name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

// For generateMetadata, the simpler inline type for params is usually fine
// as it specifically needs params.
export async function generateMetadata({ params }: { params: { eventId: string } }) {
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) return { title: 'Event Not Found' };

    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Event Not Found' };

    return {
        title: `${event.name} | SnowScore`,
        description: `Details for ${event.name}, taking place at ${event.location} from ${formatDateRange(event.start_date, event.end_date)}.`,
    };
}