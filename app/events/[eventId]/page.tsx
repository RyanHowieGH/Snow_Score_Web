// app/events/[eventId]/page.tsx
import React from 'react';
import { fetchEventById, formatDateRange } from '@/lib/data'; // Import formatDateRange
import BlankHeader from '@/components/blankHeader';
import { notFound } from 'next/navigation';
// No need to import SnowEvent here unless you use it directly for typing a variable

interface EventDetailsPageProps {
    params: {
        eventId: string;
    };
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) {
        notFound();
    }

    const event = await fetchEventById(eventId);

    if (!event) {
        notFound();
    }

    // The event dates from fetchEventById are already Date objects
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
                                {formattedDate} {/* Use the formatted date */}
                            </span>
                        </p>
                    </div>

                    {/* Displaying Divisions */}
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

                    {/* ... (rest of the component, e.g., athletes section if used) ... */}
                </div>
            </div>
        </main>
    );
}

export async function generateMetadata({ params }: EventDetailsPageProps) {
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) return { title: 'Event Not Found' };

    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Event Not Found' };

    return {
        title: `${event.name} | SnowScore`,
        description: `Details for ${event.name}, taking place at ${event.location} from ${formatDateRange(event.start_date, event.end_date)}.`, // Use imported formatDateRange
    };
}