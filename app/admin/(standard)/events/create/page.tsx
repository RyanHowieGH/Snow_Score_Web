// app/admin/events/create/page.tsx (Server Component)
import React from 'react';
import Link from 'next/link';
import { fetchDisciplines, fetchAllDivisions, Discipline, Division } from '@/lib/data';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import EventCreateForm from './EventCreateForm'; // Client component for the form
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create New Event - Admin',
};

// Helper to format discipline display text
function getDisciplineDisplayString(d: Discipline): string {
     return `${d.discipline_name} - ${d.subcategory_name} (${d.category_name})`;
}

export default async function CreateEventPage() {
    // Authorization Check
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        console.log(`User ${user?.email} role ${user?.roleName} denied access to /admin/events/create`);
        redirect('/admin'); // Redirect if not authorized
    }

    // Fetch required data in parallel
    const [disciplinesData, divisionsData] = await Promise.all([
        fetchDisciplines(),
        fetchAllDivisions()
    ]);

    // Sort disciplines for the dropdown
    const sortedDisciplines = disciplinesData.sort((a, b) => {
        return getDisciplineDisplayString(a).localeCompare(getDisciplineDisplayString(b));
    });

    // Divisions are already sorted by name from the fetch query

    return (
        <div className="space-y-6">
             <div className='flex justify-between items-center mb-4'>
                <h2 className="text-3xl font-bold">Create New Event</h2>
                <Link href="/admin/events" className="btn btn-sm btn-outline">
                    Back to Events List
                </Link>
            </div>

            <div className="card bg-base-100 shadow-md w-full max-w-2xl mx-auto"> {/* Added centering/max-width */}
                <div className="card-body">
                     {/* Pass fetched & sorted data to the Client Component form */}
                    <EventCreateForm
                        disciplines={sortedDisciplines}
                        divisions={divisionsData}
                    />
                </div>
            </div>
        </div>
    );
}