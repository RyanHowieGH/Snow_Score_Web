'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Athlete } from '@/lib/definitions';
import { updateAthleteAction, UpdateActionResult } from '@/app/admin/(standard)/athletes/actions';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface EditAthleteModalProps {
  athlete: Athlete | null;
  onClose: () => void;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <span className="loading loading-spinner"></span> : "Save Changes"}
        </button>
    );
}

export default function EditAthleteModal({ athlete, onClose }: EditAthleteModalProps) {
    // --- VVV THIS IS THE NEW STATE MANAGEMENT APPROACH VVV ---
    const [formState, setFormState] = useState<UpdateActionResult | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // This is the server action we will call.
    const action = async (formData: FormData) => {
        const result = await updateAthleteAction(null, formData);
        setFormState(result);
    };
    // --- ^^^ END OF NEW STATE MANAGEMENT APPROACH ^^^ ---

    useEffect(() => {
        if (formState?.success) {
            // If the submission was successful, close the modal after a delay
            const timer = setTimeout(() => {
                onClose(); 
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [formState, onClose]);

    // When a new athlete is selected to be edited, we clear the previous form state.
    useEffect(() => {
        setFormState(null);
    }, [athlete]);

    const dobForInput = athlete ? new Date(athlete.dob).toISOString().split('T')[0] : '';

    if (!athlete) return null;

    return (
        <dialog id="edit_athlete_modal" className="modal modal-open">
            <div className="modal-box">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><XMarkIcon className="h-6 w-6" /></button>
                <h3 className="font-bold text-lg">Edit Athlete: {athlete.first_name} {athlete.last_name}</h3>
                
                {/* The form now uses the `action` attribute with our manual wrapper */}
                <form ref={formRef} action={action} className="space-y-4 pt-4">
                    <input type="hidden" name="athleteId" value={athlete.athlete_id} />
                    
                    {/* All form inputs remain the same */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">First Name</span></div>
                            <input type="text" name="firstName" defaultValue={athlete.first_name} className="input input-bordered w-full" required />
                        </label>
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Last Name</span></div>
                            <input type="text" name="lastName" defaultValue={athlete.last_name} className="input input-bordered w-full" required />
                        </label>
                    </div>
                    {/* ... other input fields ... */}
                    <label className="form-control w-full">
                        <div className="label"><span className="label-text">Date of Birth</span></div>
                        <input type="date" name="dob" defaultValue={dobForInput} className="input input-bordered w-full" required />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Gender</span></div>
                            <input type="text" name="gender" defaultValue={athlete.gender} className="input input-bordered w-full" required />
                        </label>
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Stance</span></div>
                            <select name="stance" className="select select-bordered w-full" defaultValue={athlete.stance || ""}>
                                <option value="">N/A</option>
                                <option value="Regular">Regular</option>
                                <option value="Goofy">Goofy</option>
                            </select>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Nationality (3-letter code)</span></div>
                            <input type="text" name="nationality" defaultValue={athlete.nationality || ""} maxLength={3} className="input input-bordered w-full" />
                        </label>
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">FIS Number (7 digits)</span></div>
                            <input type="number" name="fisNum" defaultValue={athlete.fis_num || ""} className="input input-bordered w-full" />
                        </label>
                    </div>
                    
                    <div className="modal-action">
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <SubmitButton />
                    </div>
                    
                    {/* Display messages based on our manual `formState` */}
                    {formState && !formState.success && formState.message && (
                        <div role="alert" className="alert alert-error text-sm mt-4"><span>{formState.message}</span></div>
                    )}
                    {formState && formState.success && formState.message && (
                        <div role="alert" className="alert alert-success text-sm mt-4"><span>{formState.message}</span></div>
                    )}
                </form>
            </div>
            <form method="dialog" className="modal-backdrop"><button onClick={onClose}>close</button></form>
        </dialog>
    );
}