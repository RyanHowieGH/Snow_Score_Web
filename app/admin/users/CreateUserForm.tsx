// app/admin/users/CreateUserForm.tsx
'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createUserAction } from './actions'; // Import the server action

interface CreateUserFormProps {
    // Pass roles fetched by the page component
    assignableRoles: { role_id: number; role_name: string }[];
}

// Separate Submit Button component to use useFormStatus
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <span className="loading loading-spinner loading-xs"></span> : "Create User"}
        </button>
    );
}

export default function CreateUserForm({ assignableRoles }: CreateUserFormProps) {
    // useFormState hook to manage form submission state and errors
    const initialState = { success: false, message: "", error: undefined, fieldErrors: undefined };
    const [state, formAction] = useFormState(createUserAction, initialState);

    return (
        <form action={formAction} className="space-y-4 mt-4">
            {/* Email Input */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">Email*</span></div>
                <input type="email" name="email" placeholder="user@example.com" required className="input input-bordered w-full" />
                 {state?.fieldErrors?.email && <div className="label"><span className="label-text-alt text-error">{state.fieldErrors.email.join(', ')}</span></div>}
            </label>

            {/* First Name Input */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">First Name*</span></div>
                <input type="text" name="firstName" placeholder="Jane" required className="input input-bordered w-full" />
                {state?.fieldErrors?.firstName && <div className="label"><span className="label-text-alt text-error">{state.fieldErrors.firstName.join(', ')}</span></div>}
            </label>

            {/* Last Name Input */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">Last Name*</span></div>
                <input type="text" name="lastName" placeholder="Doe" required className="input input-bordered w-full" />
                 {state?.fieldErrors?.lastName && <div className="label"><span className="label-text-alt text-error">{state.fieldErrors.lastName.join(', ')}</span></div>}
            </label>

            {/* Role Selection */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">Assign Role*</span></div>
                <select name="roleId" required className="select select-bordered w-full" defaultValue="">
                    <option value="" disabled>Select a role</option>
                    {assignableRoles.map(role => (
                        <option key={role.role_id} value={role.role_id}>
                            {role.role_name}
                        </option>
                    ))}
                </select>
                 {state?.fieldErrors?.roleId && <div className="label"><span className="label-text-alt text-error">{state.fieldErrors.roleId.join(', ')}</span></div>}
            </label>

            {/* Submit Button & General Messages */}
            <div className="card-actions justify-start pt-4">
                <SubmitButton />
            </div>
            {state?.message && !state.success && (
                 <p className="text-error text-sm">{state.message}</p>
            )}
             {state?.message && state.success && (
                 <p className="text-success text-sm">{state.message}</p>
            )}
        </form>
    );
}