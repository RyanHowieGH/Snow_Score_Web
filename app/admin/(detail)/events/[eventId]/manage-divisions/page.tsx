// app/admin/(detail)/events/[eventId]/manage-divisions/page.tsx
import React from 'react';
import Link from 'next/link';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect, notFound } from 'next/navigation'; // Import notFound
// Import necessary fetch functions and types
import { fetchEventById, fetchAllDivisions, fetchAssignedDivisionIds, Division } from '@/lib/data';
import ManageDivisionsForm from '@/components/ManageDivisionsForm'; // Import the new form component
import type { Metadata } from 'next';

// Dynamic metadata generation
export async function generateMetadata({ params }: { params: { eventId: string } }): Promise<Metadata> {
    const eventId = parseInt(params.eventId, 10);
    if (isNaN(eventId)) return { title: 'Invalid Event' };
    const eventDetails = await fetchEventById(eventId); // Fetch event name for title
    return {
        title: eventDetails ? `Manage Divisions: ${eventDetails.name}` : 'Manage Event Divisions',
    };
}

// Page Component
export default async function ManageEventDivisionsPage({ params }: { params: { eventId: string } }) {
    const eventId = parseInt(params.eventId, 10);

    // Validate eventId parameter
    if (isNaN(eventId)) {
        notFound(); // Use Next.js notFound for invalid IDs
    }

    // Authorization Check
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        console.log(`User ${user?.email} role ${user?.roleName} denied access to /admin/events/${eventId}/manage-divisions`);
        redirect('/admin'); // Redirect if not authorized
    }

    // Fetch required data in parallel using Promise.all
    const [eventDetails, allDivisions, assignedDivisionIds] = await Promise.all([
        fetchEventById(eventId),    // Fetch event details (for name)
        fetchAllDivisions(),        // Fetch all possible divisions from ss_division
        fetchAssignedDivisionIds(eventId) // Fetch division IDs currently linked via ss_event_divisions
    ]);

    // Handle case where the specific event doesn't exist
    if (!eventDetails) {
         notFound(); // Event ID was valid number but not found in DB
    }

    return (
        <div className="space-y-6">
             <div className='flex justify-between items-center mb-4'>
                {/* Page Title */}
                <h2 className="text-2xl md:text-3xl font-bold">Manage Divisions: <span className='font-normal'>{eventDetails.name}</span></h2>
                {/* Link back to the specific event dashboard */}
                <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                    Back to Event Dashboard
                </Link>
            </div>

            {/* Card containing the form */}
            <div className="card bg-base-100 shadow-md w-full max-w-2xl mx-auto"> {/* Adjusted width */}
                <div className="card-body">
                    {/* Render the client form component, passing all necessary data */}
                    <ManageDivisionsForm
                        eventId={eventId}
                        eventName={eventDetails.name}
                        allDivisions={allDivisions}
                        assignedDivisionIds={assignedDivisionIds}
                    />
                </div>
            </div>
        </div>
    );
}