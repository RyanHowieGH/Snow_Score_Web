// app/admin/(standard)/users/CreateUserForm.tsx
'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createUserAction, CreateUserFormState } from './actions';

// Define roles prop type
interface Role { role_id: number; role_name: string; }
interface CreateUserFormProps { assignableRoles: Role[]; }

// Submit Button Component
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
                <> <span className="loading loading-spinner loading-xs mr-2"></span> Creating... </>
             ) : (
                 "Create User"
             )}
        </button>
    );
}

// Main Form Component
export default function CreateUserForm({ assignableRoles }: CreateUserFormProps) {
    const initialState: CreateUserFormState = {
        success: false,
        message: "",
        error: undefined,
        fieldErrors: undefined,
        tempPassword: undefined,
    };
    const [state, formAction] = useActionState(createUserAction, initialState);
    return (
        <form action={formAction} className="space-y-4 mt-4">

            {/* Email Input */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">Email*</span></div>
                <input
                    type="email"
                    name="email"
                    placeholder="user@example.com"
                    required
                    className={`input input-bordered w-full ${state?.fieldErrors?.email ? 'input-error' : ''}`}
                    aria-invalid={!!state?.fieldErrors?.email}
                    aria-describedby={state?.fieldErrors?.email ? "email-error" : undefined}
                 />
                 {state?.fieldErrors?.email && (
                    <div className="label" id="email-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.email.join(', ')}</span>
                    </div>
                 )}
            </label>

            {/* First Name Input */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">First Name*</span></div>
                <input
                    type="text"
                    name="firstName"
                    placeholder="Jane"
                    required
                    className={`input input-bordered w-full ${state?.fieldErrors?.firstName ? 'input-error' : ''}`}
                    aria-invalid={!!state?.fieldErrors?.firstName}
                    aria-describedby={state?.fieldErrors?.firstName ? "firstName-error" : undefined}
                />
                {state?.fieldErrors?.firstName && (
                     <div className="label" id="firstName-error">
                         <span className="label-text-alt text-error">{state.fieldErrors.firstName.join(', ')}</span>
                     </div>
                )}
            </label>

            {/* Last Name Input */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">Last Name*</span></div>
                <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    required
                    className={`input input-bordered w-full ${state?.fieldErrors?.lastName ? 'input-error' : ''}`}
                    aria-invalid={!!state?.fieldErrors?.lastName}
                    aria-describedby={state?.fieldErrors?.lastName ? "lastName-error" : undefined}
                />
                 {state?.fieldErrors?.lastName && (
                     <div className="label" id="lastName-error">
                         <span className="label-text-alt text-error">{state.fieldErrors.lastName.join(', ')}</span>
                     </div>
                 )}
            </label>

            {/* Role Selection */}
            <label className="form-control w-full max-w-sm">
                <div className="label"><span className="label-text">Assign Role*</span></div>
                <select
                    name="roleId"
                    required
                    className={`select select-bordered w-full ${state?.fieldErrors?.roleId ? 'select-error' : ''}`}
                    defaultValue=""
                    aria-invalid={!!state?.fieldErrors?.roleId}
                    aria-describedby={state?.fieldErrors?.roleId ? "roleId-error" : undefined}
                >
                    <option value="" disabled>Select a role</option>
                    {assignableRoles.map(role => (
                        <option key={role.role_id} value={role.role_id}>
                            {role.role_name}
                        </option>
                    ))}
                </select>
                 {state?.fieldErrors?.roleId && (
                    <div className="label" id="roleId-error">
                        <span className="label-text-alt text-error">{state.fieldErrors.roleId.join(', ')}</span>
                    </div>
                 )}
            </label>

            {/* Submit Button & General Messages */}
            <div className="card-actions justify-start pt-4">
                <SubmitButton />
            </div>

            {/* Display Error Message - Access state.message/state.success correctly */}
            {state?.message && !state.success && (
                 <div role="alert" className="alert alert-error mt-4 text-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span>{state.message}</span>
                 </div>
            )}
             {/* Display Success Message (Including Temp Password) - Access state.message/state.success/state.tempPassword correctly */}
             {/* UPDATED: Display Success Message - Simplified */}
            {state?.message && state.success && (
                <div role="alert" className="alert alert-success mt-4 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h3 className="font-bold">Success!</h3>
                        {/* The message from the server action now contains all the info */}
                        <div className="text-xs">{state.message}</div>
                    </div>
                </div>
            )}
        </form>
    );
}