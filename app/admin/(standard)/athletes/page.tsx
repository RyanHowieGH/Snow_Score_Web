// app/admin/(standard)/athletes/page.tsx

import React from 'react';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import { fetchAllAthletes } from '@/lib/data';
import AthleteList from '@/components/AthleteList';
import type { Metadata } from 'next';
import { Athlete } from '@/lib/definitions';
import SearchBar from '@/components/SearchBar'; // <-- We will create this next


export const metadata: Metadata = {
    title: 'Athletes - Admin',
    description: 'View and manage athletes in the database.',
};

interface ManageAthletesPageProps {
    searchParams?: {
        sortBy?: string;
        sortDir?: string;
        query?: string; // <-- Add query to the props
    };
}

export default async function ManageAthletesPage({ searchParams }: ManageAthletesPageProps) {
    // --- Authorization Check ---
    const user = await getAuthenticatedUserWithRole();
    const allowedViewRoles = ['Executive Director', 'Administrator', 'Chief of Competition', 'Technical Director', 'Head Judge'];
    if (!user || !allowedViewRoles.includes(user.roleName)) {
        console.log(`User ${user?.email} role ${user?.roleName} denied access to /admin/athletes`);
        redirect('/admin');
    }

    // --- VVV THIS IS THE CORRECTED LOGIC VVV ---
    // Awaiting the searchParams prop resolves the dynamic API usage warning.
    // We create a new variable to hold the resolved value.
    const resolvedSearchParams = await searchParams;
    
    const sortBy = resolvedSearchParams?.sortBy || 'athlete_id';
    const sortDir = resolvedSearchParams?.sortDir || 'asc';
    const query = resolvedSearchParams?.query || '';

    // --- ^^^ END OF CORRECTION ^^^ ---

    const validSortBy = ['athlete_id', 'last_name', 'nationality', 'fis_num'].includes(sortBy) ? sortBy : 'athlete_id';
    const validSortDir = ['asc', 'desc'].includes(sortDir) ? sortDir : 'asc';

    // Fetch all athletes server-side, passing the sort parameters
    const athletes: Athlete[] = await fetchAllAthletes(
        validSortBy as any,
        validSortDir as any,
        query // Pass the query string
    );

    return (
        <div className="space-y-6">
             <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-4'>
                <h2 className="text-2xl md:text-3xl font-bold">Athletes</h2>
                <SearchBar placeholder="Search by name or FIS #" />
            </div>
            <div className="card bg-base-100 shadow-md">
                 <div className="card-body">
                    {/* Pass the sort state to the list component */}
                    <AthleteList
                        athletes={athletes}
                        currentSortBy={validSortBy}
                        currentSortDir={validSortDir}
                    />
                </div>
            </div>
        </div>
    );
}