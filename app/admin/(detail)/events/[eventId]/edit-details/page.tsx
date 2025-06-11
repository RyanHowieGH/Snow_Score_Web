import React from 'react';
import Link from 'next/link';
import { fetchEventById, fetchDisciplines, fetchAllDivisions } from '@/lib/data';
import type { EventDetails, Discipline, Division } from '@/lib/definitions';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import Header from '@/components/header'; // Your admin header
import EventEditForm from './EventEditForm'; // We will create this client component
import type { Metadata } from 'next';

type EditEventPageProps = {
    params: { eventId: string };
};

export async function generateMetadata({ params: paramsProp }: EditEventPageProps): Promise<Metadata> {
    const params = await paramsProp;
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) return { title: 'Edit Event - Not Found' };

    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Edit Event - Not Found' };

    return {
        title: `Edit Event: ${event.name} | Admin`,
    };
}

export default async function EditEventDetailsPage({ params: paramsProp }: EditEventPageProps) {
    const params = await paramsProp;
    const eventId = Number(params.eventId);

    // Authorization
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        console.warn(`Unauthorized access attempt to edit event ${eventId} by ${user?.email}`);
        redirect('/admin?error=unauthorized_event_edit');
    }

    if (isNaN(eventId)) {
        notFound();
    }

    // Fetch data in parallel
    const [eventData, disciplines, allDivisions] = await Promise.all([
        fetchEventById(eventId),
        fetchDisciplines(),
        fetchAllDivisions()
    ]);

    if (!eventData) {
        notFound();
    }

    // Sort disciplines for the dropdown
    const sortedDisciplines = [...disciplines].sort((a, b) =>
        `${a.discipline_name} - ${a.subcategory_name} (${a.category_name})`.localeCompare(
            `${b.discipline_name} - ${b.subcategory_name} (${b.category_name})`
        )
    );

    return (
        <div>
            <Header eventName={`Edit: ${eventData.name}`} /> {/* Pass event name to admin header if it supports it */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Edit Event: {eventData.name}</h1>
                    <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                        Back to Event Dashboard
                    </Link>
                </div>

                <div className="card bg-base-100 shadow-xl w-full">
                    <div className="card-body">
                        <EventEditForm
                            event={eventData}
                            allDisciplines={sortedDisciplines}
                            allAvailableDivisions={allDivisions}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}