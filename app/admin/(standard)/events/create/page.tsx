// app/admin/events/create/page.tsx (Server Component)
import React from 'react';
import { fetchDisciplines, Discipline } from '@/lib/data'; // Fetch disciplines
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Check permission
import { redirect } from 'next/navigation';
import EventCreateForm from './EventCreateForm'; // Client component for the form
import Link from 'next/link';

export const metadata = {
    title: 'Create New Event',
};

// Helper function to create the display string for sorting/display
function getDisciplineDisplayString(d: Discipline): string {
     return `${d.discipline_name} - ${d.subcategory_name} (${d.category_name})`;
}

export default async function CreateEventPage() {
    // Authorization Check
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        console.log(`User ${user?.email} role ${user?.roleName} denied access to /admin/events/create`);
        redirect('/admin');
    }

    // Fetch disciplines data
    const disciplinesData: Discipline[] = await fetchDisciplines();

    // --- SORT DISCIPLINES HERE ---
    const sortedDisciplines = disciplinesData.sort((a, b) => {
        const displayA = getDisciplineDisplayString(a);
        const displayB = getDisciplineDisplayString(b);
        return displayA.localeCompare(displayB); // Alphabetical sort based on display string
    });
    // --- END SORT ---

    return (
        <div className="space-y-6">
             <div className='flex justify-between items-center'>
                <h2 className="text-3xl font-bold">Create New Event</h2>
                <Link href="/events" className="btn btn-sm btn-outline">
                    Back to Events List
                </Link>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                     {/* Pass the SORTED list to the Client Component form */}
                    <EventCreateForm disciplines={sortedDisciplines} />
                </div>
            </div>
        </div>
    );
}