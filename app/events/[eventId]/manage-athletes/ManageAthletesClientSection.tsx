// app/admin/events/[eventId]/manage-athletes/ManageAthletesClientSection.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
// import type { RegisteredAthlete } from '@/lib/data';
import type { RegisteredAthlete } from '@/lib/definitions'; // Adjust the import path as necessary
import {
    getEventAthletesAction,
    removeAthleteFromEventAction,
    importAthletesFromCsvAction
} from './actions'; // Assuming actions.ts is in the same directory

interface ManageAthletesClientSectionProps {
    eventId: number;
    initialAthletes: RegisteredAthlete[]; // Now expecting this prop
}

// Destructure initialAthletes from props
export default function ManageAthletesClientSection({ eventId, initialAthletes }: ManageAthletesClientSectionProps) {
    // Initialize 'athletes' state with 'initialAthletes' prop
    const [athletes, setAthletes] = useState<RegisteredAthlete[]>(initialAthletes || []);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isProcessing, startTransition] = useTransition(); // Renamed from isPending for clarity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; errors?: any[] } | null>(null);

    useEffect(() => {
        // This effect runs when 'initialAthletes' prop changes.
        // It ensures the component's local 'athletes' state stays in sync
        // with the data passed from the server component.
        setAthletes(initialAthletes || []);
    }, [initialAthletes]); // Dependency array: re-run effect if initialAthletes changes

    const refreshAthletesList = async () => {
        startTransition(async () => {
            setFeedback(null);
            const result = await getEventAthletesAction(eventId);
            if (result.success && result.data) {
                setAthletes(result.data);
            } else {
                setFeedback({ type: 'error', message: result.error || 'Could not refresh athletes list.' });
            }
        });
    };

    // This useEffect might be redundant if initialAthletes is always provided and up-to-date.
    // However, if you want to ensure a fresh fetch on mount or eventId change, you could use it.
    // For now, relying on the prop and the above useEffect for initial data.
    // useEffect(() => {
    //    refreshAthletesList();
    // }, [eventId]);


    const handleCsvImportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const currentForm = event.currentTarget;
        if (!csvFile) {
            setFeedback({ type: 'error', message: 'Please select a CSV file.' });
            return;
        }
        setFeedback(null);
        const formData = new FormData();
        formData.append('csvFile', csvFile);
        formData.append('eventId', String(eventId));

        startTransition(async () => {
            const result = await importAthletesFromCsvAction(formData);
            if (result.success) {
                setFeedback({ type: 'success', message: result.message || 'Athletes imported successfully!' });
                refreshAthletesList();
            } else {
                setFeedback({ type: 'error', message: result.error || 'Failed to import athletes.', errors: result.errors });
            }
            setCsvFile(null);
            currentForm.reset();
        });
    };

    const handleRemoveAthleteClick = (athleteId: number) => {
        if (!confirm("Are you sure you want to remove this athlete from the event registration?")) {
            return;
        }
        setFeedback(null);
        startTransition(async () => {
            const result = await removeAthleteFromEventAction(eventId, athleteId);
            if (result.success) {
                setFeedback({ type: 'success', message: result.message || 'Athlete removed.' });
                refreshAthletesList();
            } else {
                setFeedback({ type: 'error', message: result.error || 'Failed to remove athlete.' });
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* CSV Import Section */}
            <div className="card bg-base-200 shadow-lg">
                <form onSubmit={handleCsvImportSubmit} className="card-body">
                    <h3 className="card-title text-lg">Import Athletes from CSV</h3>
                    <p className="text-xs opacity-70 mb-2">
                        Required columns: first_name, last_name, dob (YYYY-MM-DD), gender. Optional: bib_num, nationality, stance, fis_num. (Header row expected)
                    </p>
                    <div className="form-control">
                        <input
                            type="file"
                            accept=".csv"
                            key={csvFile ? 'file-selected' : 'no-file'} // To help with visual reset
                            onChange={(e) => {
                                setCsvFile(e.target.files ? e.target.files[0] : null);
                                setFeedback(null); // Clear feedback when new file is selected
                            }}
                            className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-md"
                            required // Make file input required for form submission
                        />
                    </div>
                    <div className="card-actions justify-start mt-2">
                        <button type="submit" className="btn btn-secondary btn-sm" disabled={isProcessing || !csvFile}>
                            {isProcessing ? 'Importing...' : 'Upload and Process CSV'}
                        </button>
                    </div>
                </form>
            </div>

             {/* Feedback Display */}
            {feedback && (
                <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} shadow-sm text-sm my-4`}>
                    <div>
                        <span>{feedback.message}</span>
                        {feedback.errors && feedback.errors.length > 0 && (
                            <div className="mt-2">
                                <p className="font-semibold text-xs">Specific row errors:</p>
                                <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                                    {feedback.errors.map((err, index) => (
                                        <li key={index}>
                                            Row {err.row}: {err.message}
                                            {err.data && <pre className="whitespace-pre-wrap bg-base-300 p-1 rounded text-xs mt-1">{JSON.stringify(err.data, null, 2)}</pre>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Registered Athletes List Section */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="card-title text-lg">Registered Athletes ({athletes.length})</h3>
                        <button 
                            onClick={refreshAthletesList} 
                            className="btn btn-xs btn-outline btn-primary" 
                            disabled={isProcessing}
                        >
                            {isProcessing && !csvFile ? 'Refreshing...' : 'Refresh List'}
                        </button>
                    </div>

                    {isProcessing && athletes.length === 0 && <div className="flex justify-center py-4"><span className="loading loading-dots loading-md"></span></div>}
                    {!isProcessing && athletes.length === 0 && (
                        <p className="italic py-4 text-center">No athletes are currently registered for this event.</p>
                    )}
                    {athletes.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra table-sm w-full">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Bib #</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {athletes.map((athlete) => (
                                        <tr key={athlete.athlete_id}>
                                            <td>{athlete.first_name} {athlete.last_name}</td>
                                            <td>{athlete.bib_num || <span className="italic text-xs">N/A</span>}</td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => handleRemoveAthleteClick(athlete.athlete_id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                    disabled={isProcessing}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}