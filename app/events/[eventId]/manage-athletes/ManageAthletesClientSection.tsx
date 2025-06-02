'use client'; // This will be a client component

import React, { useState, useEffect, useTransition } from 'react';
import type { RegisteredAthlete } from '@/lib/data'; // Assuming RegisteredAthlete type is in lib/data.ts

// You will eventually import server actions here:
// import { importAthletesFromCsvAction, removeAthleteFromEventAction, getEventAthletesAction } from './actions'; // Assuming actions.ts in the same directory

interface ManageAthletesClientSectionProps {
    eventId: number;
    // initialAthletes: RegisteredAthlete[]; // You might pass initially loaded athletes as a prop
}

export default function ManageAthletesClientSection({ eventId /*, initialAthletes */ }: ManageAthletesClientSectionProps) {
    // State for managing the list of athletes displayed
    const [athletes, setAthletes] = useState<RegisteredAthlete[]>(/* initialAthletes || */ []);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition(); // For loading states during server action calls
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Placeholder: Function to fetch/refresh athletes
    const refreshAthletesList = async () => {
        console.log(`Placeholder: Refreshing athletes for event ID: ${eventId}`);
        // In a real implementation, this would call a server action:
        // const result = await getEventAthletesAction(eventId);
        // if (result.success && result.data) {
        //     setAthletes(result.data);
        // } else {
        //     setFeedback({ type: 'error', message: result.error || 'Failed to load athletes.' });
        // }
        // For now, let's simulate some data if initialAthletes is not provided
        if (athletes.length === 0) { // Simple check to avoid overwriting if props were used
            // setAthletes([
            //     { athlete_id: 1, first_name: 'John', last_name: 'Doe', bib_num: '101' },
            //     { athlete_id: 2, first_name: 'Jane', last_name: 'Smith', bib_num: '102' },
            // ]);
        }
    };

    // Fetch initial athletes if not passed as props (or for refresh)
    useEffect(() => {
        // If you decide to fetch on client mount instead of passing initialAthletes prop
        // refreshAthletesList();
        // For now, we expect initialAthletes to be potentially passed or list to be empty
    }, [eventId]);


    const handleCsvImportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!csvFile) {
            setFeedback({ type: 'error', message: 'Please select a CSV file.' });
            return;
        }
        setFeedback(null);

        const formData = new FormData();
        formData.append('csvFile', csvFile);
        formData.append('eventId', String(eventId)); // Server actions often take FormData or simple serializable args

        startTransition(async () => {
            setFeedback({ type: 'success', message: `Placeholder: Simulating import of ${csvFile.name} for event ${eventId}...` });
            // const result = await importAthletesFromCsvAction(formData);
            // if (result.success) {
            //     setFeedback({ type: 'success', message: result.message || 'Import successful!' });
            //     refreshAthletesList(); // Refresh the list
            // } else {
            //     setFeedback({ type: 'error', message: result.error || 'Import failed.' });
            // }
        });
    };

    const handleRemoveAthleteClick = (athleteId: number) => {
        setFeedback(null);
        startTransition(async () => {
            setFeedback({ type: 'success', message: `Placeholder: Simulating removal of athlete ${athleteId} from event ${eventId}...` });
            // const result = await removeAthleteFromEventAction(eventId, athleteId);
            // if (result.success) {
            //     setFeedback({ type: 'success', message: result.message || 'Athlete removed.' });
            //     refreshAthletesList(); // Refresh the list
            // } else {
            //     setFeedback({ type: 'error', message: result.error || 'Removal failed.' });
            // }
            // Client-side optimistic update for demo purposes:
            setAthletes(prevAthletes => prevAthletes.filter(athlete => athlete.athlete_id !== athleteId));
        });
    };

    return (
        <div className="space-y-8">
            {/* CSV Import Section */}
            <div className="card bg-base-200 shadow-lg">
                <form onSubmit={handleCsvImportSubmit} className="card-body">
                    <h3 className="card-title text-lg">Import Athletes from CSV</h3>
                    <p className="text-xs opacity-70 mb-2">
                        Columns: first_name, last_name, dob (YYYY-MM-DD), gender. Optional: bib_num, nationality, stance, fis_num.
                    </p>
                    <div className="form-control">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                            className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-md"
                        />
                    </div>
                    <div className="card-actions justify-start mt-2">
                        <button type="submit" className="btn btn-secondary btn-sm" disabled={isPending || !csvFile}>
                            {isPending ? 'Importing...' : 'Upload and Process CSV'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Registered Athletes List Section */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="card-title text-lg">Registered Athletes</h3>
                    {feedback && (
                        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} shadow-sm text-sm my-4`}>
                            <div>
                                <span>{feedback.message}</span>
                            </div>
                        </div>
                    )}
                    {isPending && <p>Processing...</p>}
                    {!isPending && athletes.length === 0 && (
                        <p className="italic py-4">No athletes are currently registered for this event.</p>
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
                                            <td>{athlete.bib_num || 'N/A'}</td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => handleRemoveAthleteClick(athlete.athlete_id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                    disabled={isPending}
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
            {/* You might add a manual "Add Single Athlete" form/modal trigger here */}
        </div>
    );
}