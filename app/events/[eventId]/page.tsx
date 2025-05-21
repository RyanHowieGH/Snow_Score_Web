// app/events/[eventId]/page.tsx
import React from 'react';
import { fetchEventById, formatDateRange } from '@/lib/data';
import BlankHeader from '@/components/blankHeader';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

type PageSegmentProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Remove searchParams from destructuring if not used
export default async function EventDetailsPage({ params }: PageSegmentProps) {
    const actualParams = await params;
    const eventId = Number(actualParams.eventId);

    // ... (rest of the component)
}

export async function generateMetadata(
  // Remove searchParams and parent from destructuring if not used
  { params }: PageSegmentProps,
  // parent: ResolvingMetadata // Keep if you plan to use it, remove/comment if not
): Promise<Metadata> {
    const actualParams = await params;
    const eventId = Number(actualParams.eventId);

    // ... (rest of the function, no reference to searchParams or parent)

    if (isNaN(eventId)) {
        return { title: 'Event Not Found' };
    }
    const event = await fetchEventById(eventId);
    if (!event) {
        return { title: 'Event Not Found' };
    }
    return {
        title: `${event.name} | SnowScore`,
        description: `Details for ${event.name}, taking place at ${event.location} from ${formatDateRange(event.start_date, event.end_date)}.`,
    };
}