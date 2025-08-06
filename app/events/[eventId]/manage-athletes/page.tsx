// app/admin/events/[eventId]/manage-athletes/page.tsx
import React from 'react';
import Link from 'next/link';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { fetchEventById } from '@/lib/data'; // Assuming this fetches basic event details
// You will need a new function to fetch athletes for an event:
import { fetchRegisteredAthletesForEvent } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ManageAthletesClientSection from './ManageAthletesClientSection'; // We'll create this

type ManageAthletesPageProps = {
    params: { eventId: string };
};

export async function generateMetadata({ params }: ManageAthletesPageProps): Promise<Metadata> {
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) return { title: 'Event Not Found - Manage Athletes' };
    const event = await fetchEventById(eventId); // fetchEventById needs to be updated for status and discipline_name
    if (!event) return { title: 'Event Not Found - Manage Athletes' };
    return { title: `Manage Athletes: ${event.name}` };
}

export default async function ManageAthletesPage({ params }: ManageAthletesPageProps) {
    const eventId = Number(params.eventId);

    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin');
    }

    if (isNaN(eventId)) notFound();
    const event = await fetchEventById(eventId);
    if (!event) notFound();

    // Fetch athletes registered for this event.
    // This function needs to be created in lib/data.ts
    const initialAthletes = await fetchRegisteredAthletesForEvent(eventId);

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <div className='flex flex-col sm:flex-row justify-between items-center gap-2 mb-4'>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold">Manage Athletes</h2>
                    <p className="text-lg text-base-content/80">
                        For Event: <span className="font-semibold">{event.name}</span>
                        (Status: <span className="font-semibold">{event.status || 'N/A'}</span>)
                    </p>
                </div>
                {/* Link back to the main event detail/edit page OR event list */}
                <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                    View/Edit Event Details
                </Link>
                {/* Or link back to the events list */}
                {/* <Link href="/admin/events" className="btn btn-sm btn-outline">
                    Back to Events List
                </Link> */}
            </div>

            {/* Client component to handle athlete management UI and actions */}
            <ManageAthletesClientSection
                eventId={eventId}
                initialAthletes={initialAthletes || []} // Pass initially fetched athletes
            />

            <div className="mt-8 flex justify-end gap-3">
                {event.status === 'Draft' || event.status === 'Inactive' && (
                    // This would call another server action to update event status
                    <button className="btn btn-success">Publish Event</button>
                )}
                <Link href="/admin/events" className="btn btn-neutral">
                    Done / Back to Events
                </Link>
            </div>
        </div>
    );
}