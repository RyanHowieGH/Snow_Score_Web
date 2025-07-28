'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { UserWithRole } from '@/lib/definitions';
import { updateUserRoleAction, UserActionResult } from './actions';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Role {
    role_id: number;
    role_name: string;
}

interface EditUserRoleModalProps {
  userToEdit: UserWithRole | null;
  assignableRoles: Role[];
  onClose: () => void;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <span className="loading loading-spinner"></span> : "Save Role"}
        </button>
    );
}

export default function EditUserRoleModal({ userToEdit, assignableRoles, onClose }: EditUserRoleModalProps) {
    // --- VVV THIS IS THE CORRECTED STATE MANAGEMENT VVV ---
    const [formState, setFormState] = useState<UserActionResult | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // This is the server action wrapper we will call.
    const action = async (formData: FormData) => {
        const result = await updateUserRoleAction(null, formData);
        setFormState(result);
    };
    // --- ^^^ END OF CORRECTION ^^^ ---

    useEffect(() => {
        // --- VVV FIX: Listen to `formState`, not `state` VVV ---
        if (formState?.success) {
            const timer = setTimeout(() => onClose(), 1200);
            return () => clearTimeout(timer);
        }
    }, [formState, onClose]);

    // This effect correctly resets our manual state when a new user is selected.
    useEffect(() => {
        setFormState(null);
    }, [userToEdit]);


    if (!userToEdit) return null;

    const currentRoleId = assignableRoles.find(r => r.role_name === userToEdit.role_name)?.role_id;

    return (
        <dialog id="edit_role_modal" className="modal modal-open">
            <div className="modal-box">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><XMarkIcon className="h-6 w-6" /></button>
                <h3 className="font-bold text-lg">Edit Role for {userToEdit.first_name} {userToEdit.last_name}</h3>
                <p className="py-2 text-sm text-base-content/70">Current Role: <span className="font-semibold">{userToEdit.role_name}</span></p>
                
                {/* --- VVV FIX: Use the `action` wrapper, not `formAction` VVV --- */}
                <form ref={formRef} action={action} className="space-y-4 pt-4">
                    <input type="hidden" name="userId" value={userToEdit.user_id} />
                    
                    <label className="form-control w-full">
                        <div className="label"><span className="label-text">New Role</span></div>
                        <select
                            name="newRoleId"
                            className="select select-bordered w-full"
                            defaultValue={currentRoleId}
                            required
                        >
                            {assignableRoles.map(role => (
                                <option key={role.role_id} value={role.role_id}>
                                    {role.role_name}
                                </option>
                            ))}
                        </select>
                    </label>
                    
                    <div className="modal-action">
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <SubmitButton />
                    </div>
                    
                    {/* --- VVV FIX: Use `formState` to display messages, not `state` VVV --- */}
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