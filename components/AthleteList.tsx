// components/AthleteList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Athlete } from '@/lib/definitions';
import DeleteAthleteButton from './DeleteAthleteButton';
import EditAthleteModal from './EditAthleteModal'; 
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { ArrowUpIcon as ArrowUpSolid, ArrowDownIcon as ArrowDownSolid } from '@heroicons/react/24/solid';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface AthleteListProps {
    athletes: Athlete[];
    currentSortBy: string;
    currentSortDir: string;
}

export default function AthleteList({ athletes: initialAthletes, currentSortBy, currentSortDir }: AthleteListProps) {
    // We use state to manage the list for instant optimistic UI updates on delete.
    const [athletes, setAthletes] = useState(initialAthletes);
    const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});
    const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
    const pathname = usePathname();

    // This effect ensures that if the sorted list from the server changes, our component's state updates.
    useEffect(() => {
        setAthletes(initialAthletes);
    }, [initialAthletes]);

    const handleDeletionError = (athleteId: number, message: string) => {
         setErrorMessages(prev => ({ ...prev, [athleteId]: message }));
         setTimeout(() => {
             setErrorMessages(prev => {
                 const newState = { ...prev };
                 delete newState[athleteId];
                 return newState;
             });
         }, 7000);
    };

    const handleSuccessfulDeletion = (deletedAthleteId: number) => {
         setAthletes(prev => prev.filter(a => a.athlete_id !== deletedAthleteId));
         setErrorMessages(prev => {
             const newState = { ...prev };
             delete newState[deletedAthleteId];
             return newState;
         });
    };

    // --- VVV SORTING LOGIC FROM PREVIOUS SUGGESTION VVV ---
    const createSortLink = (column: string) => {
        const newSortDir = currentSortBy === column && currentSortDir === 'asc' ? 'desc' : 'asc';
        const params = new URLSearchParams();
        params.set('sortBy', column);
        params.set('sortDir', newSortDir);
        return `${pathname}?${params.toString()}`;
    };

    const SortableHeader = ({ column, label }: { column: string; label: string }) => {
        const isActive = currentSortBy === column;
        return (
          <Link href={createSortLink(column)} className="group inline-flex items-center whitespace-nowrap">
            {label}
            <span className="w-5 h-5 ml-1"> {/* Fixed-size container for the icon */}
                {isActive ? (
                  currentSortDir === 'asc' ? (
                    <ArrowUpSolid className="h-4 w-4 text-primary" />
                  ) : (
                    <ArrowDownSolid className="h-4 w-4 text-primary" />
                  )
                ) : (
                  // Show a faint, generic sort icon that becomes less faint on hover
                  <ArrowsUpDownIcon className="h-4 w-4 text-base-content/20 group-hover:text-base-content/50 transition-colors" />
                )}
            </span>
          </Link>
        );
    };

    // Handle case where initial list is empty
    if (!athletes || athletes.length === 0) {
        return <p className="text-center italic my-6 text-base-content/70">No athletes found in the database.</p>;
    }

    return (
        <>
        <div className="overflow-x-auto w-full">
            {/* Display error messages above the table */}
             {Object.entries(errorMessages).map(([id, msg]) => (
                  <div key={`err-${id}`} role="alert" className="alert alert-error my-2 shadow-sm text-sm max-w-xl mx-auto">
                       <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <span>Error deleting athlete ID {id}: {msg}</span>
                  </div>
             ))}

            <table className="table table-zebra table-sm w-full">
                {/* Table Head */}
                <thead>
                    <tr className="text-xs uppercase">
                        <th><SortableHeader column="athlete_id" label="ID" /></th>
                        <th><SortableHeader column="last_name" label="Name" /></th>
                        <th>DOB</th>
                        <th>Gender</th>
                        <th><SortableHeader column="nationality" label="Nat." /></th>
                        <th><SortableHeader column="fis_num" label="FIS #" /></th>
                        <th>Stance</th>
                        <th className='text-center'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {athletes.map((athlete) => (
                        <tr key={athlete.athlete_id} className="hover text-sm">
                            <th className="font-medium">{athlete.athlete_id}</th>
                            <td>{athlete.first_name} {athlete.last_name}</td>
                            <td>{new Date(athlete.dob).toLocaleDateString()}</td>
                            <td>{athlete.gender}</td>
                            <td>{athlete.nationality || '-'}</td>
                            <td>{athlete.fis_num || '-'}</td>
                            <td>{athlete.stance || '-'}</td>
                            <td className='text-center'>
                                <div className="flex items-center justify-center gap-1">
                                        {/* --- VVV NEW EDIT BUTTON VVV --- */}
                                        <button 
                                            onClick={() => setEditingAthlete(athlete)}
                                            className="btn btn-xs btn-ghost text-info hover:bg-info hover:text-info-content p-1"
                                            title="Edit Athlete"
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        
                                        <DeleteAthleteButton
                                            athleteId={athlete.athlete_id}
                                            athleteName={`${athlete.first_name} ${athlete.last_name}`}
                                            onDeleted={handleSuccessfulDeletion}
                                            onError={handleDeletionError}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- VVV NEW MODAL COMPONENT RENDER VVV --- */}
            {/* The modal will only be visible when `editingAthlete` is not null */}
            <EditAthleteModal
                athlete={editingAthlete}
                onClose={() => setEditingAthlete(null)} 
            />
        </>
    );
}