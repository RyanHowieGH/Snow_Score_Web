'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useFormStatus, useFormState } from 'react-dom';
import { importAthletesFromCsvAction, removeAthleteFromEventAction, getEventAthletesAction, type ImportAthletesActionResult } from './actions';import type { RegisteredAthlete } from '@/lib/definitions'; // Import the correct result type
import { TrashIcon, InformationCircleIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
            {pending ? (
                <> <span className="loading loading-spinner loading-xs mr-2"></span> Importing... </>
            ) : (
                <> <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" /> Upload and Import Roster </>
            )}
        </button>
    );
}

export default function ManageAthletesClientSection({ eventId, initialAthletes }: {
    eventId: number;
    initialAthletes: RegisteredAthlete[];
}) {
    const [athletes, setAthletes] = useState(initialAthletes);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const initialState: ImportAthletesActionResult | null = null;
    const [importState, importFormAction] = useFormState(importAthletesFromCsvAction, initialState);

    useEffect(() => {
        if (importState?.success) {
            getEventAthletesAction(eventId).then(result => {
                if (result.success && result.data) {
                    setAthletes(result.data);
                }
            });
            const fileInput = document.getElementById('csvFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    }, [importState, eventId]);

    const handleRemoveAthlete = async (athleteId: number) => {
        if (!confirm('Are you sure you want to remove this athlete from the event? This will not delete their main profile.')) {
            return;
        }
        setDeletingId(athleteId);
        setDeleteError(null);
        const result = await removeAthleteFromEventAction(eventId, athleteId);
        if (result.success) {
            setAthletes(currentAthletes => currentAthletes.filter(a => a.athlete_id !== athleteId));
        } else {
            setDeleteError(result.error || 'Failed to remove athlete.');
        }
        setDeletingId(null);
    };

    return (
        <div className="space-y-8">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title">Import Roster from CSV</h3>
                    <p className="text-sm text-base-content/70 mb-4">Upload a CSV file to add or update athletes. Existing athletes will be matched by FIS Number or Name+DOB and their profiles will be updated.</p>
                    
                    <form action={importFormAction}>
                        <input type="hidden" name="eventId" value={eventId} />
                        <div className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="form-control w-full">
                                <label htmlFor="csvFile" className="label"><span className="label-text">Select CSV File</span></label>
                                <input type="file" name="csvFile" id="csvFile" required className="file-input file-input-bordered w-full" />
                            </div>
                            <SubmitButton />
                        </div>
                    </form>
                    
                    {importState && (
                        <div className="mt-4">
                            {importState.message && (
                                <div role="alert" className={`alert text-sm ${importState.success ? 'alert-success' : 'alert-error'}`}>
                                    <InformationCircleIcon className="h-5 w-5" />
                                    <span>{importState.message}</span>
                                </div>
                            )}
                            {importState.errors && importState.errors.length > 0 && (
                                <div className="mt-4 p-4 bg-warning/10 rounded-md">
                                    <h4 className="font-bold text-warning">Import Errors/Skipped Rows:</h4>
                                    <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                                        {importState.errors.map((err, index) => (
                                            <li key={index}><strong>Row {err.row}:</strong> {err.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title">Current Roster ({athletes.length})</h3>
                    {deleteError && <p className="text-sm text-error">{deleteError}</p>}
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead><tr><th>Bib #</th><th>Name</th><th>Actions</th></tr></thead>
                            <tbody>
                                {athletes.length > 0 ? (
                                    athletes.map(athlete => (
                                        <tr key={athlete.athlete_id} className="hover">
                                            <td>{athlete.bib_num || 'N/A'}</td>
                                            <td>{athlete.first_name} {athlete.last_name}</td>
                                            <td>
                                                <button onClick={() => handleRemoveAthlete(athlete.athlete_id)} className="btn btn-xs btn-ghost text-error" disabled={deletingId === athlete.athlete_id}>
                                                    {deletingId === athlete.athlete_id ? <span className="loading loading-spinner loading-xs"></span> : <TrashIcon className="h-4 w-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="text-center italic">No athletes are currently registered for this event.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}