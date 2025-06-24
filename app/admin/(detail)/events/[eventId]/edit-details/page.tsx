import React from 'react';
import Link from 'next/link';
import { fetchEventById, fetchDisciplines, fetchAllDivisions } from '@/lib/data';
// Make sure these types are imported from your centralized definitions file
// import type { EventDetails, Discipline, Division } from '@/lib/definitions';
import type { Discipline, Division } from '@/lib/definitions';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
// import Header from '@/components/header'; // Assuming Header is part of admin layout
import EventEditForm from './EventEditForm';
import type { Metadata } from 'next';

// Define the shape of the resolved params object
interface ResolvedPageParams {
    eventId: string;
}

// VVV --- THIS IS THE KEY CHANGE FOR THE TYPE ERROR --- VVV
type EditEventPageProps = {
    params: Promise<ResolvedPageParams>; // params is a Promise that resolves to an object with eventId
    // searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Add if you use searchParams
};
// ^^^ --- THIS IS THE KEY CHANGE FOR THE TYPE ERROR --- ^^^

export async function generateMetadata(
    { params: paramsPromise }: EditEventPageProps // Renamed prop to paramsPromise for clarity
): Promise<Metadata> {
    const params = await paramsPromise; // Await the promise to get the actual params object
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) return { title: 'Edit Event - Not Found | SnowScore Admin' }; // Consistent title

    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Edit Event - Not Found | SnowScore Admin' }; // Consistent title

    return {
        title: `Edit Event: ${event.name} | SnowScore Admin`, // Consistent title
    };
}

export default async function EditEventDetailsPage(
    { params: paramsPromise }: EditEventPageProps // Renamed prop to paramsPromise for clarity
) {
    const params = await paramsPromise; // Await the promise to get the actual params object
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
    const [eventData, disciplinesData, allDivisionsData] = await Promise.all([ // Renamed for clarity before sorting
        fetchEventById(eventId),
        fetchDisciplines(),
        fetchAllDivisions()
    ]);

    if (!eventData) {
        notFound();
    }

    // Ensure disciplinesData and allDivisionsData are actually of type Discipline[] and Division[]
    // The types are inferred from the fetch functions, but explicit casting or checking can be added if needed.
    const disciplines: Discipline[] = disciplinesData;
    const allDivisions: Division[] = allDivisionsData;


    // Sort disciplines for the dropdown
    const sortedDisciplines = [...disciplines].sort((a, b) => {
        // Ensure properties exist before trying to access them for sorting
        const nameA = `${a.discipline_name || ''} - ${a.subcategory_name || ''} (${a.category_name || ''})`;
        const nameB = `${b.discipline_name || ''} - ${b.subcategory_name || ''} (${b.category_name || ''})`;
        return nameA.localeCompare(nameB);
    });

    return (
        <div>
            {/* Admin Header would typically be in app/admin/layout.tsx */}
            {/* <Header eventName={`Edit: ${eventData.name}`} /> */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-base-300">
                    <h1 className="text-2xl sm:text-3xl font-bold">Edit Event: {eventData.name}</h1>
                    <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline mt-2 sm:mt-0">
                        Back to Event Dashboard
                    </Link>
                </div>

                <div className="card bg-base-100 shadow-xl w-full">
                    <div className="card-body p-6 md:p-8"> {/* Added padding to card-body */}
                        <EventEditForm
                            event={eventData} // EventDetails type
                            allDisciplines={sortedDisciplines} // Discipline[] type
                            allAvailableDivisions={allDivisions} // Division[] type
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}