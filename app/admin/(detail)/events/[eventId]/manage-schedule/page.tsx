// app\admin\(detail)\events\[eventId]\manage-schedule\page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { fetchScheduleHeats, fetchEventById } from '@/lib/data';
import { AutoSortingSchedule } from './AutoSortingSchedule'; // <-- New component name
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Adjusted import path for user role auth
import { redirect } from 'next/navigation';

    
export default async function ManageSchedulePage({ params: paramsProp }: { params: { eventId: string } }) {
    
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition', 'Head Judge'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/sign-in?redirectUrl=/admin/events');
    }
    
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