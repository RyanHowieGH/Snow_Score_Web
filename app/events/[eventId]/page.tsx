// app/events/[eventId]/page.tsx
import React from 'react';
import { fetchEventById, formatDateRange } from '@/lib/data';
import BlankHeader from '@/components/blankHeader';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

// Define the Props type as shown in the Next.js 15 documentation
type PageSegmentProps = {
  params: Promise<{ eventId: string }>; // params is a Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams is a Promise
};

// The Page component itself needs to be async to await the params
export default async function EventDetailsPage({ params, searchParams }: PageSegmentProps) {
    // Await the params Promise to get the actual parameters object
    const actualParams = await params;
    const eventId = Number(actualParams.eventId);

    // You could also await searchParams if needed:
    // const actualSearchParams = await searchParams;

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

export async function generateMetadata(
  { params, searchParams }: PageSegmentProps, // Use the same Props type
  parent: ResolvingMetadata // parent is also a Promise resolving to Metadata
): Promise<Metadata> {
    // Await the params Promise
    const actualParams = await params;
    const eventId = Number(actualParams.eventId);

    // Await searchParams if needed
    // const actualSearchParams = await searchParams;

    if (isNaN(eventId)) {
        return {
            title: 'Event Not Found',
        };
    }

    const event = await fetchEventById(eventId);

    if (!event) {
        return {
            title: 'Event Not Found',
        };
    }

    // Example of using parent metadata (optional)
    // const parentMetadata = await parent;
    // const previousImages = parentMetadata.openGraph?.images || [];

    return {
        title: `${event.name} | SnowScore`,
        description: `Details for ${event.name}, taking place at ${event.location} from ${formatDateRange(event.start_date, event.end_date)}.`,
        // openGraph: {
        //   images: [...previousImages, '/new-image.jpg'],
        // },
    };
}