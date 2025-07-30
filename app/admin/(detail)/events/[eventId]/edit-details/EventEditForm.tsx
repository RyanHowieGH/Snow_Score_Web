'use client';

import React, { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import type { EventDetails, Discipline, Division } from '@/lib/definitions'; // Assuming types from definitions
import { updateEventAction, type UpdateEventFormState } from './actions';
import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/24/outline';


interface EventEditFormProps {
    event: EventDetails; // Pre-fetched event data including current divisions and their num_rounds
    allDisciplines: Discipline[]; // All disciplines in the system
    allAvailableDivisions: Division[]; // All base divisions available in the system
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
            {pending ? (
                <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Saving Changes...
                </>
            ) : (
                "Save Event Changes"
            )}
        </button>
    );
}

export default function EventEditForm({ event, allDisciplines, allAvailableDivisions }: EventEditFormProps) {
    const initialState: UpdateEventFormState = {
        success: false,
        message: "",
    };

    // Bind eventId to the server action
    const updateEventActionWithId = updateEventAction.bind(null, event.event_id);
    const [state, formAction] = useActionState(updateEventActionWithId, initialState);


    const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(event.discipline_id?.toString() || "");

    // Initialize selectedDivisionIds from the event's current divisions
    const [selectedDivisionIds, setSelectedDivisionIds] = useState<Set<string>>(() =>
        new Set(event.divisions.map(d => String(d.division_id)))
    );

    // Initialize numRoundsByDivision from the event's current divisions
    // Each division object in event.divisions should now have a num_rounds property
    const [numRoundsByDivision, setNumRoundsByDivision] = useState<Record<string, number>>(() => {
        const initialRounds: Record<string, number> = {};
        event.divisions.forEach(div => {
            initialRounds[String(div.division_id)] = div.num_rounds ?? 3; // Default to 3 if num_rounds is not set
        });
        return initialRounds;
    });

    // Effect to reset form state based on props if the event object changes
    // This is useful if the parent page re-fetches and passes a new event object after an update
    useEffect(() => {
        setSelectedDivisionIds(new Set(event.divisions.map(d => String(d.division_id))));
        const updatedInitialRounds: Record<string, number> = {};
        event.divisions.forEach(div => {
            updatedInitialRounds[String(div.division_id)] = div.num_rounds ?? 3;
        });
        setNumRoundsByDivision(updatedInitialRounds);
        setSelectedDisciplineId(event.discipline_id?.toString() || "");

    }, [event]);


    const handleDivisionSelectionChange = (divisionIdStr: string) => {
        setSelectedDivisionIds(prevSelectedIds => {
            const newSelectedIds = new Set(prevSelectedIds);
            if (newSelectedIds.has(divisionIdStr)) {
                newSelectedIds.delete(divisionIdStr);
                // Optionally remove from numRoundsByDivision or keep it for re-selection
                setNumRoundsByDivision(currentRounds => {
                    const updated = {...currentRounds};
                    // delete updated[divisionIdStr]; // Uncomment to clear rounds when deselected
                    return updated;
                });
            } else {
                newSelectedIds.add(divisionIdStr);
                // Set default rounds if newly selected and not already set
                setNumRoundsByDivision(currentRounds => ({
                    ...currentRounds,
                    [divisionIdStr]: currentRounds[divisionIdStr] || 3
                }));
            }
            return newSelectedIds;
        });
    };

    const handleNumRoundsChange = (divisionIdStr: string, numRoundsStr: string) => {
        const rounds = parseInt(numRoundsStr, 10);
        if (!isNaN(rounds) && rounds >= 1 && rounds <= 10) {
            setNumRoundsByDivision(prev => ({
                ...prev,
                [divisionIdStr]: rounds
            }));
        }
    };

    return (
        <form action={formAction} className="space-y-6 md:space-y-8">
            {/* General form success/error messages */}
            {state?.message && (
                <div role="alert" className={`alert ${state.success ? 'alert-success' : 'alert-error'} text-sm shadow-md`}>
                    <InformationCircleIcon className="h-5 w-5 mr-2"/>
                    <span>{state.message} {state.error && `Details: ${state.error}`}</span>
                </div>
            )}
            {state?.fieldErrors?.general && (
                 <div role="alert" className="alert alert-error text-sm">
                    <InformationCircleIcon className="h-5 w-5 mr-2"/>
                    <span>{state.fieldErrors.general.join(', ')}</span>
                </div>
            )}


            {/* Event Name */}
            <label className="form-control w-full">
                <div className="label"><span className="label-text text-base font-medium">Event Name*</span></div>
                <input type="text" name="name" defaultValue={event.name} required className={`input input-bordered w-full ${state?.fieldErrors?.name ? 'input-error' : ''}`} />
                {state?.fieldErrors?.name && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.name.join(', ')}</span></div>}
            </label>

            {/* Location */}
            <label className="form-control w-full">
                <div className="label"><span className="label-text text-base font-medium">Location*</span></div>
                <input type="text" name="location" defaultValue={event.location} required className={`input input-bordered w-full ${state?.fieldErrors?.location ? 'input-error' : ''}`} />
                {state?.fieldErrors?.location && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.location.join(', ')}</span></div>}
            </label>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <label className="form-control w-full">
                    <div className="label"><span className="label-text text-base font-medium">Start Date*</span></div>
                    <input type="date" name="start_date" defaultValue={event.start_date.toISOString().split('T')[0]} required className={`input input-bordered w-full ${state?.fieldErrors?.start_date || (state?.fieldErrors?.end_date && state.message.includes("End date cannot be before start date")) ? 'input-error' : ''}`} />
                    {state?.fieldErrors?.start_date && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.start_date.join(', ')}</span></div>}
                </label>
                <label className="form-control w-full">
                    <div className="label"><span className="label-text text-base font-medium">End Date*</span></div>
                    <input type="date" name="end_date" defaultValue={event.end_date.toISOString().split('T')[0]} required className={`input input-bordered w-full ${state?.fieldErrors?.end_date ? 'input-error' : ''}`} />
                    {state?.fieldErrors?.end_date && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.end_date.join(', ')}</span></div>}
                </label>
            </div>

            {/* Discipline */}
            <label className="form-control w-full">
                <div className="label"><span className="label-text text-base font-medium">Discipline*</span></div>
                <select 
                    name="discipline_id" 
                    // Use `value` to make it a controlled component
                    value={selectedDisciplineId} 
                    // Update the state on change
                    onChange={(e) => setSelectedDisciplineId(e.target.value)}
                    required 
                    className={`select select-bordered w-full ${state?.fieldErrors?.discipline_id ? 'select-error' : ''}`}
                >
                    <option value="" disabled>Select a discipline</option>
                    {allDisciplines.map(d => (
                        <option key={d.discipline_id} value={d.discipline_id}>
                            {`${d.discipline_name || 'N/A'} - ${d.subcategory_name || 'N/A'} (${d.category_name || 'N/A'})`}
                        </option>
                    ))}
                </select>
                {state?.fieldErrors?.discipline_id && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.discipline_id.join(', ')}</span></div>}
            </label>

            {/* Divisions & Rounds Management */}
            <div className="form-control w-full space-y-2">
                <label className="label py-0"><span className="label-text text-base font-medium">Event Divisions & Number of Rounds</span></label>
                <div className="p-4 border rounded-lg bg-base-200/40 space-y-3 shadow-sm">
                    {allAvailableDivisions.map(div => (
                        <div key={div.division_id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-md ${selectedDivisionIds.has(String(div.division_id)) ? 'bg-primary/10' : 'bg-base-100/50'} border border-base-300`}>
                            <label className="label cursor-pointer justify-start gap-3 flex-grow py-1 sm:py-2">
                                <input
                                    type="checkbox"
                                    name="division_ids"
                                    value={String(div.division_id)}
                                    checked={selectedDivisionIds.has(String(div.division_id))}
                                    onChange={() => handleDivisionSelectionChange(String(div.division_id))}
                                    className="checkbox checkbox-primary checkbox-md"
                                />
                                <span className="label-text text-base">{div.division_name}</span>
                            </label>
                            {selectedDivisionIds.has(String(div.division_id)) && (
                                <div className="form-control w-full sm:w-48 mt-2 sm:mt-0">
                                    <label className="label py-0 mb-1"><span className="label-text text-xs">Rounds (1-10):</span></label>
                                    <select
                                        name={`num_rounds_div_${div.division_id}`}
                                        value={numRoundsByDivision[String(div.division_id)] || 3}
                                        onChange={(e) => handleNumRoundsChange(String(div.division_id), e.target.value)}
                                        className="select select-bordered select-sm w-full"
                                    >
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                    {allAvailableDivisions.length === 0 && <p className="text-sm italic p-2">No base divisions found in the system.</p>}
                </div>
                {state?.fieldErrors?.division_ids && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.division_ids.join(', ')}</span></div>}
                {state?.fieldErrors?.num_rounds && <div className="label pt-1"><span className="label-text-alt text-error">{state.fieldErrors.num_rounds.join(', ')}</span></div>}
            </div>

            {/* Link to Athlete Management */}
            <div className="pt-4">
                <h3 className="text-xl font-semibold mb-3">Athlete Registrations</h3>
                <Link href={`/admin/events/${event.event_id}/manage-athletes`} className="btn btn-secondary btn-outline">
                    Go to Manage Athletes Page
                </Link>
            </div>

            {/* Submit Area */}
            <div className="card-actions justify-end pt-6 border-t border-base-300 mt-6">
                <Link href={`/admin/events/${event.event_id}`} className="btn btn-ghost mr-2">
                    Cancel
                </Link>
                <SubmitButton />
            </div>
        </form>
    );
}