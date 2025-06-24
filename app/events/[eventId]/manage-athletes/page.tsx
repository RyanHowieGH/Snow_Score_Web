// app/events/[eventId]/manage-athletes/page.tsx

import React from 'react';
import Link from 'next/link';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { fetchEventById, fetchRegisteredAthletesForEvent } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ManageAthletesClientSection from './ManageAthletesClientSection'; // Your client component
// Import types from your definitions file
import type { EventDetails, RegisteredAthlete } from '@/lib/definitions';

// Define the shape of the resolved params object
interface ResolvedManageAthletesParams {
    eventId: string;
    // Add other dynamic segments if they exist in this path
}

// Update prop type: params is now a Promise
type ManageAthletesPageProps = {
    params: Promise<ResolvedManageAthletesParams>; // <<< KEY FIX
};

export async function generateMetadata(
    { params: paramsPromise }: ManageAthletesPageProps // Prop is a Promise
): Promise<Metadata> {
    const params = await paramsPromise; // <<< AWAIT PARAMS
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) return { title: 'Event Not Found - Manage Athletes | SnowScore' };
    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Event Not Found - Manage Athletes | SnowScore' };
    return { title: `Manage Athletes: ${event.name} | SnowScore` }; // Adjusted title
}

export default async function ManageAthletesPage(
    { params: paramsPromise }: ManageAthletesPageProps // Prop is a Promise
) {
    const params = await paramsPromise; // <<< AWAIT PARAMS
    const eventId = Number(params.eventId);

    // Authorization: Is this page meant to be public or admin-only?
    // The path app/events/... usually implies public.
    // If it's admin-only, it should probably be under app/admin/...
    // The current auth check redirects to /admin, which might be confusing if this isn't an admin page.
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        // If this page IS intended to be admin-only, this redirect is fine.
        // If it was meant to be a public "view athletes for event X" page, remove/adjust auth.
        console.warn(`ManageAthletesPage: Unauthorized access attempt for event ${eventId} by ${user?.email}`);
        redirect('/admin?error=unauthorized_athlete_management');
    }

    if (isNaN(eventId)) {
        notFound();
    }
    const event: EventDetails | null = await fetchEventById(eventId); // Ensure EventDetails includes 'status'
    if (!event) {
        notFound();
    }

    const initialAthletes: RegisteredAthlete[] = await fetchRegisteredAthletesForEvent(eventId);

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <div className='flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 pb-4 border-b border-base-300'>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold">Manage Athletes</h2>
                    <p className="text-lg text-base-content/80">
                        For Event: <span className="font-semibold">{event.name}</span>
                        (Status: <span className={`badge badge-sm ${
                            event.status?.toLowerCase() === 'scheduled' ? 'badge-success' :
                            event.status?.toLowerCase() === 'completed' ? 'badge-primary' :
                            event.status?.toLowerCase() === 'cancelled' ? 'badge-error' : 'badge-ghost'
                        } badge-outline`}>{event.status || 'N/A'}</span>)
                    </p>
                </div>
                <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                    Event Dashboard
                </Link>
            </div>

            {/* Client component to handle athlete management UI and actions */}
            <ManageAthletesClientSection
                eventId={eventId}
                initialAthletes={initialAthletes || []} // Pass initially fetched athletes
                // Pass eventDivisions if your ClientSection needs them
                // eventDivisions={event.divisions || []}
            />

            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-base-300">
                {event.status?.toLowerCase() === 'draft' && (
                    <button className="btn btn-success order-last sm:order-first">Publish Event</button>
                )}
                <Link href={`/admin/events/${eventId}`} className="btn btn-neutral">
                    Done / Back to Event Dashboard
                </Link>
            </div>
        </div>
    );
}