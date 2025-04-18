// components/ManageDivisionsForm.tsx
'use client';


import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateEventDivisionsAction, UpdateDivisionsFormState } from '@/app/admin/(detail)/events/[eventId]/manage-divisions/actions';
import type { Division } from '@/lib/data';

// Props for the form component
interface ManageDivisionsFormProps {
    eventId: number;
    eventName: string;
    allDivisions: Division[];       // All possible divisions from ss_division
    assignedDivisionIds: number[]; // IDs currently assigned to this event
}

// Submit button component using useFormStatus
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
                <> <span className="loading loading-spinner loading-xs"></span> Saving... </>
            ) : (
                "Save Division Assignments"
            )}
        </button>
    );
}

// Main Form Component
export default function ManageDivisionsForm({
    eventId,
    eventName,
    allDivisions,
    assignedDivisionIds
}: ManageDivisionsFormProps) {

    // Initialize form state
    const initialState: UpdateDivisionsFormState = {
        success: false,
        message: ""
    };
    const [state, formAction] = useFormState(updateEventDivisionsAction, initialState);

    // Create a Set from assigned IDs for efficient checking in defaultChecked
    const assignedSet = new Set(assignedDivisionIds);

    return (
        // Form calls the server action
        <form action={formAction} className="space-y-4">
            {/* Hidden input to pass eventId to the action */}
            <input type="hidden" name="eventId" value={eventId} />

            <h3 className="card-title text-lg">Assign Divisions for &quot;{eventName}&quot;</h3>
            <p className="text-sm opacity-70 mb-2">Select the divisions that will compete in this event. Unchecking all will remove all divisions.</p>

            {/* Division Checkboxes Section */}
            <div className="form-control w-full">
                <label className="label" id="division-group-label">
                    <span className="label-text font-semibold">Available Divisions</span>
                    <span className="label-text-alt">({assignedDivisionIds.length} currently assigned)</span>
                </label>
                <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 p-3 border rounded-lg ${state?.fieldErrors?.division_ids ? 'border-error' : 'border-base-300'}`}
                    role="group" // for accessibility
                    aria-labelledby="division-group-label"
                    aria-describedby={state?.fieldErrors?.division_ids ? "division-ids-error" : undefined}
                >
                     {allDivisions.length > 0 ? (
                          allDivisions.map(div => (
                            <label key={div.division_id} className="label cursor-pointer justify-start gap-2 p-1">
                                <input
                                    type="checkbox"
                                    name="division_ids" // Crucial: Same name for all checkboxes in group
                                    value={String(div.division_id)} // Value sent to action is string
                                    // Set default checked state based on initial assigned IDs
                                    defaultChecked={assignedSet.has(div.division_id)}
                                    className="checkbox checkbox-primary checkbox-sm"
                                />
                                <span className="label-text text-sm">{div.division_name}</span>
                            </label>
                          ))
                     ) : (
                          // Message if no divisions exist in the database at all
                          <p className="text-sm italic col-span-full text-base-content/70 p-2">
                              No divisions found in the database. Please add base divisions via admin settings.
                          </p>
                     )}
                </div>
                 {/* Display validation error for the checkbox group */}
                 {state?.fieldErrors?.division_ids && (
                    <div className="label" id="division-ids-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.division_ids.join(', ')}</span>
                    </div>
                 )}
            </div>

            {/* Submit Button & Action Messages */}
            <div className="card-actions justify-start pt-4">
                <SubmitButton />
            </div>

             {/* Display general messages returned from the server action */}
             {state?.message && (
                  <div role="alert" className={`alert ${state.success ? 'alert-success' : 'alert-error'} mt-4 text-sm`}>
                     {state.success ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     )}
                     <span>{state.message}</span>
                  </div>
             )}
        </form>
    );
}