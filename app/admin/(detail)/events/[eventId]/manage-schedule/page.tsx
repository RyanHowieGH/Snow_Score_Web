// This file is now a Server Component (no 'use client')
import React from 'react';
import { fetchHeatsForEventSchedule } from '@/lib/data';
import { notFound } from 'next/navigation';
import { updateHeatScheduleAction } from './actions';
import { ScheduleForm } from './ScheduleForm'; // <-- Import your new component

export default async function ManageSchedulePage({ params }: { params: { eventId: string } }) {
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) {
        notFound();
    }

    const heats = await fetchHeatsForEventSchedule(eventId);
    
    // Bind the eventId to the server action so the form doesn't need to know about it
    const boundUpdateAction = updateHeatScheduleAction.bind(null, eventId);

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Event Schedule</h1>
                {/* You can add a Back button or other elements here */}
            </div>
            
            {/* Render the Client Component, passing the fetched data and action */}
            <ScheduleForm heats={heats} action={boundUpdateAction} />
        </div>
    );
}