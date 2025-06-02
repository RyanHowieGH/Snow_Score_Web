// app/admin/(standard)/events/create/EventCreateForm.tsx
'use client';

import React from 'react';
import { useActionState } from 'react';    // For React 19+ / Next.js 15+
import { useFormStatus } from 'react-dom';

// Ensure this action name matches the one in your ./actions.ts file
// that saves as draft and redirects to athlete management.
import { saveDraftAndGoToManageAthletesAction, CreateEventFormState } from './actions';
import type { Discipline, Division } from '@/lib/data';

interface EventCreateFormProps {
    disciplines: Discipline[];
    divisions: Division[];
}

// Separate Submit Button component to leverage useFormStatus
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
                <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Saving Draft...
                </>
             ) : (
                 "Save Draft & Manage Athletes" // Updated button text
             )}
        </button>
    );
}

// Main Form Component
export default function EventCreateForm({ disciplines, divisions }: EventCreateFormProps) {
    const initialState: CreateEventFormState = {
        success: false,
        message: "",
        error: undefined,
        fieldErrors: undefined,
    };

    // Use the action that saves as draft and proceeds to athlete management
    const [state, formAction] = useActionState(saveDraftAndGoToManageAthletesAction, initialState);

    return (
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
                        className={`input input-bordered w-full ${state?.fieldErrors?.start_date || (state?.fieldErrors?.end_date && state.message.includes("End date cannot be before start date")) ? 'input-error' : ''}`}
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
                    defaultValue="" // Ensures the placeholder option is selected by default
                    aria-invalid={!!state?.fieldErrors?.discipline_id}
                    aria-describedby={state?.fieldErrors?.discipline_id ? "discipline-error" : undefined}
                >
                    <option value="" disabled>Select a discipline</option>
                    {disciplines.map(d => (
                        <option key={d.discipline_id} value={d.discipline_id}>
                           {/* Using the getDisciplineDisplayString logic directly or via an imported helper */}
                           {`${d.discipline_name || 'Unknown'} - ${d.subcategory_name || 'N/A'} (${d.category_name || 'N/A'})`}
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
                <label className="label" id="division-label"> {/* Added id for better accessibility if needed by aria-labelledby */}
                    <span className="label-text font-semibold">Assign Divisions*</span>
                    <span className="label-text-alt">(Select at least one, if applicable for draft)</span>
                </label>
                <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 p-3 border rounded-lg ${state?.fieldErrors?.division_ids ? 'border-error' : 'border-base-300'}`}
                    role="group"
                    aria-labelledby="division-label"
                    aria-describedby={state?.fieldErrors?.division_ids ? "division-ids-error" : undefined}
                >
                     {divisions.length > 0 ? (
                          divisions.map(div => (
                            <label key={div.division_id} className="label cursor-pointer justify-start gap-2 p-0">
                                <input
                                    type="checkbox"
                                    name="division_ids" // Same name for all checkboxes in the group
                                    value={String(div.division_id)} // Value MUST be string for FormData
                                    className="checkbox checkbox-primary checkbox-sm"
                                    // defaultChecked could be used if editing, but not for create
                                />
                                <span className="label-text text-sm">{div.division_name}</span>
                            </label>
                          ))
                     ) : (
                          <p className="text-sm italic col-span-full text-base-content/70">No divisions found. Please add divisions first.</p>
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
            {/* Note: Success message might not be visible if redirect happens immediately */}
            {state?.message && !state.success && ( // Show general errors if not field-specific
                 <div role="alert" className="alert alert-error mt-4 text-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span>Error: {state.message} {state.error && `(${state.error})`}</span>
                 </div>
            )}
             {state?.message && state.success && ( // Show success if action doesn't redirect immediately
                 <div role="alert" className="alert alert-success mt-4 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span>{state.message}</span>
                 </div>
            )}
        </form>
    );
}