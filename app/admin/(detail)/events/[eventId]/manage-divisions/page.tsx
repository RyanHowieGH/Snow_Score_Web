// app/admin/(detail)/events/[eventId]/manage-divisions/page.tsx
import React from 'react';
import Link from 'next/link';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect, notFound } from 'next/navigation'; // Import notFound
// Import necessary fetch functions and types
import { fetchEventById, fetchAllDivisions, fetchAssignedDivisionIds } from '@/lib/data';
import ManageDivisionsForm from '@/components/ManageDivisionsForm'; // Import the new form component
import type { Metadata } from 'next';


// --- Define Explicit Page Props Type ---
interface ManageEventDivisionsPageProps {
    params: {
        eventId: string; // eventId from the URL segment
    };
    // searchParams?: { [key: string]: string | string[] | undefined }; // Optional searchParams if needed
}
// --- End Props Type Definition ---

// Dynamic metadata generation (using the defined props type)
export async function generateMetadata({ params }: ManageEventDivisionsPageProps): Promise<Metadata> {
    const eventId = parseInt(params.eventId, 10);
    if (isNaN(eventId)) return { title: 'Invalid Event' };
    const eventDetails = await fetchEventById(eventId);
    return {
        title: eventDetails ? `Manage Divisions: ${eventDetails.name}` : 'Manage Event Divisions',
    };
}

// Page Component
export default async function ManageEventDivisionsPage({ params }: ManageEventDivisionsPageProps) {
    // --- Type of params is now explicitly ManageEventDivisionsPageProps['params'] ---
    const eventId = parseInt(params.eventId, 10);

    if (isNaN(eventId)) {
        notFound();
    }

    // Authorization Check
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin');
    }

    // Fetch required data
    const [eventDetails, allDivisions, assignedDivisionIds] = await Promise.all([
        fetchEventById(eventId),
        fetchAllDivisions(),
        fetchAssignedDivisionIds(eventId)
    ]);

    if (!eventDetails) {
         notFound();
    }

    return (
        <div className="space-y-6">
             <div className='flex justify-between items-center mb-4'>
                <h2 className="text-2xl md:text-3xl font-bold">Manage Divisions: <span className='font-normal'>{eventDetails.name}</span></h2>
                <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                    Back to Event Dashboard
                </Link>
            </div>

            <div className="card bg-base-100 shadow-md w-full max-w-2xl mx-auto">
                <div className="card-body">
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