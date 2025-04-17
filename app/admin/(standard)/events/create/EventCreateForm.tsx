// app/admin/events/create/EventCreateForm.tsx (Client Component)
'use client';

// Assuming React 19:
// import React, { useActionState } from 'react';
// import { useFormStatus } from 'react-dom';
// If React 18:
import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { createEventAction, CreateEventFormState } from './actions'; // Import action and state type
import type { Discipline, Division } from '@/lib/data'; // Import types for props

// Define props expected by this component
interface EventCreateFormProps {
    disciplines: Discipline[];
    divisions: Division[]; // Receive the pre-fetched divisions
}

// Separate Submit Button component to leverage useFormStatus
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
                <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Creating...
                </>
             ) : (
                 "Create Event"
             )}
        </button>
    );
}

// Main Form Component
export default function EventCreateForm({ disciplines, divisions }: EventCreateFormProps) {
    // Initialize form state using useActionState (React 19)
    const initialState: CreateEventFormState = {
        success: false,
        message: "",
        error: undefined,
        fieldErrors: undefined,
    };
    const [state, formAction] = useFormState(createEventAction, initialState);
    // If React 18: const [state, formAction] = useFormState(createEventAction, initialState);

    return (
        // The form element calls the server action directly
        <form action={formAction} className="space-y-4">

            {/* Event Name Input */}
            <label className="form-control w-full">
                <div className="label">
                    <span className="label-text">Event Name*</span>
                </div>
                <input
                    type="text"
                    name="name"
                    placeholder="e.g., Annual Slope Jam"
                    required
                    className={`input input-bordered w-full ${state?.fieldErrors?.name ? 'input-error' : ''}`}
                    aria-invalid={!!state?.fieldErrors?.name}
                    aria-describedby={state?.fieldErrors?.name ? "name-error" : undefined}
                />
                {state?.fieldErrors?.name && (
                    <div className="label" id="name-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.name.join(', ')}</span>
                    </div>
                 )}
            </label>

            {/* Location Input */}
            <label className="form-control w-full">
                <div className="label">
                    <span className="label-text">Location*</span>
                </div>
                <input
                    type="text"
                    name="location"
                    placeholder="e.g., Big White Resort"
                    required
                    className={`input input-bordered w-full ${state?.fieldErrors?.location ? 'input-error' : ''}`}
                    aria-invalid={!!state?.fieldErrors?.location}
                    aria-describedby={state?.fieldErrors?.location ? "location-error" : undefined}
                 />
                 {state?.fieldErrors?.location && (
                    <div className="label" id="location-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.location.join(', ')}</span>
                    </div>
                 )}
            </label>

            {/* Start and End Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <label className="form-control w-full">
                    <div className="label">
                        <span className="label-text">Start Date*</span>
                    </div>
                    <input
                        type="date"
                        name="start_date"
                        required
                        className={`input input-bordered w-full ${state?.fieldErrors?.start_date || state?.fieldErrors?.end_date ? 'input-error' : ''}`} // Highlight if end date error exists too
                        aria-invalid={!!state?.fieldErrors?.start_date}
                        aria-describedby={state?.fieldErrors?.start_date ? "start-date-error" : undefined}
                     />
                     {state?.fieldErrors?.start_date && (
                        <div className="label" id="start-date-error">
                            <span className="label-text-alt text-error">{state.fieldErrors.start_date.join(', ')}</span>
                        </div>
                     )}
                </label>
                 <label className="form-control w-full">
                    <div className="label">
                        <span className="label-text">End Date*</span>
                    </div>
                    <input
                        type="date"
                        name="end_date"
                        required
                        className={`input input-bordered w-full ${state?.fieldErrors?.end_date ? 'input-error' : ''}`}
                        aria-invalid={!!state?.fieldErrors?.end_date}
                        aria-describedby={state?.fieldErrors?.end_date ? "end-date-error" : undefined}
                     />
                     {state?.fieldErrors?.end_date && (
                        <div className="label" id="end-date-error">
                            <span className="label-text-alt text-error">{state.fieldErrors.end_date.join(', ')}</span>
                        </div>
                     )}
                </label>
            </div>

             {/* Discipline Dropdown */}
            <label className="form-control w-full">
                <div className="label">
                    <span className="label-text">Discipline*</span>
                </div>
                <select
                    name="discipline_id"
                    required
                    className={`select select-bordered w-full ${state?.fieldErrors?.discipline_id ? 'select-error' : ''}`}
                    defaultValue=""
                    aria-invalid={!!state?.fieldErrors?.discipline_id}
                    aria-describedby={state?.fieldErrors?.discipline_id ? "discipline-error" : undefined}
                >
                    <option value="" disabled>Select a discipline</option>
                    {disciplines.map(d => (
                        <option key={d.discipline_id} value={d.discipline_id}>
                           {d.discipline_name} - {d.subcategory_name} ({d.category_name})
                        </option>
                    ))}
                </select>
                 {state?.fieldErrors?.discipline_id && (
                    <div className="label" id="discipline-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.discipline_id.join(', ')}</span>
                    </div>
                 )}
            </label>

            {/* Division Checkboxes */}
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text font-semibold">Assign Divisions*</span>
                    <span className="label-text-alt">(Select at least one)</span>
                </label>
                <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 p-3 border rounded-lg ${state?.fieldErrors?.division_ids ? 'border-error' : 'border-base-300'}`}
                    role="group" // for accessibility
                    aria-labelledby="division-label"
                    aria-describedby={state?.fieldErrors?.division_ids ? "division-ids-error" : undefined}
                >
                     {divisions.length > 0 ? (
                          divisions.map(div => (
                            <label key={div.division_id} className="label cursor-pointer justify-start gap-2 p-0"> {/* Adjust padding */}
                                <input
                                    type="checkbox"
                                    name="division_ids" // Same name for all checkboxes in the group
                                    value={String(div.division_id)} // Value MUST be string for FormData
                                    className="checkbox checkbox-primary checkbox-sm"
                                />
                                <span className="label-text text-sm">{div.division_name}</span>
                            </label>
                          ))
                     ) : (
                          <p className="text-sm italic col-span-full text-base-content/70">No divisions found in the database. Please add divisions first.</p>
                     )}
                </div>
                 {state?.fieldErrors?.division_ids && (
                    <div className="label" id="division-ids-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.division_ids.join(', ')}</span>
                    </div>
                 )}
            </div>

            {/* Submit Button & General Messages */}
            <div className="card-actions justify-start pt-4">
                <SubmitButton />
            </div>

            {/* Display general error/success messages from the server action state */}
            {state?.message && !state.success && (
                 <div role="alert" className="alert alert-error mt-4 text-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span>{state.message}</span>
                 </div>
            )}
             {/* Success message might not be seen due to redirect */}
             {state?.message && state.success && (
                 <div role="alert" className="alert alert-success mt-4 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span>{state.message}</span>
                 </div>
            )}
        </form>
    );
}