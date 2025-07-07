'use client'; // <-- MUST be the very first line

import React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ScheduleFormState } from './actions';
import type { HeatForSchedule } from '@/lib/definitions';

// Helper to format the timestamp for the input field
function formatDateTimeForInput(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Adjust for timezone offset before formatting
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
}

// Submit Button Component
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving..." : "Save Schedule"}
        </button>
    );
}

// The main form component
export function ScheduleForm({ heats, action }: { heats: HeatForSchedule[], action: (prevState: ScheduleFormState | null, formData: FormData) => Promise<ScheduleFormState> }) {
    const initialState: ScheduleFormState = { success: false, message: '' };
    const [state, formAction] = useActionState(action, initialState);

    return (
        <form action={formAction}>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Division</th>
                            <th>Round</th>
                            <th>Heat #</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {heats.map((heat) => (
                            <tr key={heat.round_heat_id}>
                                <td>{heat.division_name}</td>
                                <td>{heat.round_name}</td>
                                <td>{heat.heat_num}</td>
                                <td>
                                    <input
                                        type="datetime-local"
                                        name={`start_time_${heat.round_heat_id}`}
                                        defaultValue={formatDateTimeForInput(heat.start_time)}
                                        className="input input-bordered input-sm"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="datetime-local"
                                        name={`end_time_${heat.round_heat_id}`}
                                        defaultValue={formatDateTimeForInput(heat.end_time)}
                                        className="input input-bordered input-sm"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex items-center gap-4">
                <SubmitButton />
                {state?.message && (
                    <p className={`text-sm ${state.success ? 'text-success' : 'text-error'}`}>
                        {state.message}
                    </p>
                )}
            </div>
        </form>
    );
}