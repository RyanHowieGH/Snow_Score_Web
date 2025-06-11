// app/admin/(standard)/events/create/page.tsx
import React from 'react';
import Link from 'next/link';
import { fetchDisciplines, fetchAllDivisions } from '@/lib/data';
import { Discipline } from '@/lib/definitions';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import EventCreateForm from './EventCreateForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create New Event - Admin',
};

// Helper to format discipline display text
function getDisciplineDisplayString(d: Discipline): string {
     // Added checks for null/undefined properties just in case
     const disciplineName = d.discipline_name || 'Unknown Discipline';
     const subCategory = d.subcategory_name || 'N/A';
     const category = d.category_name || 'N/A';
     return `${disciplineName} - ${subCategory} (${category})`;
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
        fetchAllDivisions() // Fetch all base divisions for the form
    ]);

    // Sort disciplines for the dropdown
    const sortedDisciplines = [...disciplinesData].sort((a, b) => { // Create shallow copy before sort
        return getDisciplineDisplayString(a).localeCompare(getDisciplineDisplayString(b));
    });


    return (
        <div className="space-y-6">
             <div className='flex flex-col sm:flex-row justify-between items-center gap-2 mb-4'>
                <h2 className="text-2xl md:text-3xl font-bold">Create New Event</h2>
                <Link href="/admin/events" className="btn btn-sm btn-outline">
                    Back to Events List
                </Link>
            </div>

            <div className="card bg-base-100 shadow-md w-full max-w-2xl mx-auto">
                <div className="card-body">
                    <EventCreateForm
                        disciplines={sortedDisciplines}
                        divisions={divisionsData} // Pass divisions to the form
                    />
                </div>
            </div>
        </div>
    );
}