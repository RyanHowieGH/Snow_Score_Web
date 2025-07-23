// app\admin\(detail)\events\[eventId]\manage-schedule\page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { fetchScheduleHeats, fetchEventById } from '@/lib/data';
import { AutoSortingSchedule } from './AutoSortingSchedule'; // <-- New component name

export default async function ManageSchedulePage({ params: paramsProp }: { params: { eventId: string } }) {
    const params = await paramsProp;
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) notFound();

    const [heats, eventDetails] = await Promise.all([
        fetchScheduleHeats(eventId),
        fetchEventById(eventId)
    ]);

    if (!eventDetails) notFound();

    return (
        <div className="bg-base-200 min-h-screen p-4 md:p-6">
            <AutoSortingSchedule
                initialHeats={heats}
                eventDetails={eventDetails}
                eventId={eventId}
            />
        </div>
    );
}