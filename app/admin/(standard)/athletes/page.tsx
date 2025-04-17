// app/admin/(standard)/athletes/page.tsx
import React from 'react';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import { fetchAllAthletes, Athlete } from '@/lib/data';
import AthleteList from '@/components/AthleteList'; // Import client list component
import type { Metadata } from 'next';

// Page metadata
export const metadata: Metadata = {
    title: 'Manage Athletes - Admin',
    description: 'View and manage athletes in the database.',
};

// This is a Server Component
export default async function ManageAthletesPage() {
    // --- Authorization Check ---
    const user = await getAuthenticatedUserWithRole();
    // Define roles allowed to VIEW this page (adjust as needed)
    const allowedViewRoles = ['Executive Director', 'Administrator', 'Chief of Competition', 'Technical Director', 'Head Judge'];
    if (!user || !allowedViewRoles.includes(user.roleName)) {
        console.log(`User ${user?.email} role ${user?.roleName} denied access to /admin/athletes`);
        redirect('/admin'); // Or redirect to an unauthorized page
    }
    // --- End Authorization Check ---

    // Fetch all athletes server-side
    const athletes: Athlete[] = await fetchAllAthletes();

    return (
        <div className="space-y-6">
             {/* Page Header */}
             <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-4'>
                <h2 className="text-2xl md:text-3xl font-bold">Manage Athletes</h2>
                {/* Optional: Add button to navigate to a future Add Athlete page */}
                {/* <Link href="/admin/athletes/add" className="btn btn-sm btn-primary">
                    Add New Athlete
                </Link> */}
            </div>

            {/* Card containing the athlete list */}
            <div className="card bg-base-100 shadow-md">
                 <div className="card-body">
                     {/* Render the client component list, passing fetched data */}
                    <AthleteList athletes={athletes} />
                </div>
            </div>
        </div>
    );
}