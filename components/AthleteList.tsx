// components/AthleteList.tsx
'use client';

import React, { useState } from 'react';
// import type { Athlete } from '@/lib/data';\
import type { Athlete } from '@/lib/definitions'; // Ensure this import matches your Athlete type definition
import DeleteAthleteButton from './DeleteAthleteButton';

interface AthleteListProps {
    athletes: Athlete[];
}

export default function AthleteList({ athletes: initialAthletes }: AthleteListProps) {
    const [athletes, setAthletes] = useState(initialAthletes);
    // Store error messages keyed by athlete ID
    const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});

    const handleDeletionError = (athleteId: number, message: string) => {
         console.log(`Setting error for ${athleteId}: ${message}`);
         setErrorMessages(prev => ({ ...prev, [athleteId]: message }));
         setTimeout(() => {
             setErrorMessages(prev => {
                 const newState = { ...prev };
                 delete newState[athleteId];
                 return newState;
             });
         }, 7000); // Clear after 7 seconds
    };

    const handleSuccessfulDeletion = (deletedAthleteId: number) => {
         console.log(`Deletion successful for ${deletedAthleteId}, list should revalidate.`);
         setAthletes(prev => prev.filter(a => a.athlete_id !== deletedAthleteId));
         // Clear any previous error for this athlete
         setErrorMessages(prev => {
             const newState = { ...prev };
             delete newState[deletedAthleteId];
             return newState;
         });
    };

    // Handle case where initial list is empty
    if (!athletes || athletes.length === 0) {
        return <p className="text-center italic my-6 text-base-content/70">No athletes found in the database.</p>;
    }

    return (
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
                        <th>ID</th>
                        <th>Name</th>
                        <th>DOB</th>
                        <th>Gender</th>
                        <th>Nat.</th>
                        <th>FIS #</th>
                        <th>Stance</th>
                        <th className='text-center'>Actions</th>
                    </tr>
                </thead>
                {/* Table Body */}
                <tbody>
                    {athletes.map((athlete) => (
                        <tr key={athlete.athlete_id} className="hover text-sm">
                            <th className="font-medium">{athlete.athlete_id}</th>
                            <td>{athlete.first_name} {athlete.last_name}</td>
                            {/* Format date for display */}
                            <td>{athlete.dob instanceof Date ? athlete.dob.toLocaleDateString() : 'Invalid Date'}</td>
                            <td>{athlete.gender}</td>
                            <td>{athlete.nationality || '-'}</td>
                            <td>{athlete.fis_num || '-'}</td>
                            <td>{athlete.stance || '-'}</td>
                            <td className='text-center'>
                                {/* Delete Button */}
                                <DeleteAthleteButton
                                    athleteId={athlete.athlete_id}
                                    athleteName={`${athlete.first_name} ${athlete.last_name}`}
                                    onDeleted={handleSuccessfulDeletion}
                                    onError={handleDeletionError} // Pass bound handler
                                />
                                {/* Placeholder for Edit Button */}
                                {/* <button className="btn btn-xs btn-ghost text-info ml-1 p-1" title="Edit Athlete">
                                    <PencilIcon className="h-4 w-4" />
                                </button> */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}