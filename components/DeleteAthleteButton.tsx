// components/DeleteAthleteButton.tsx
'use client';

import React, { useTransition, useState } from 'react';
// Adjust path based on your actions file location
import { deleteAthleteAction } from '@/app/admin/(standard)/athletes/actions';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteAthleteButtonProps {
    athleteId: number;
    athleteName: string; // Used for the confirmation message
    // Callbacks to inform the parent list component
    onDeleted: (athleteId: number) => void;
    onError: (athleteId: number, message: string) => void;
}

export default function DeleteAthleteButton({
    athleteId,
    athleteName,
    onDeleted,
    onError
}: DeleteAthleteButtonProps) {
    // useTransition manages pending state without blocking UI
    const [isPending, startTransition] = useTransition();
    // Local error state if needed for this button specifically
    // const [error, setError] = useState<string | null>(null);

    const handleClick = () => {
        // Simple browser confirmation dialog
        if (!window.confirm(`Are you sure you want to permanently delete athlete: ${athleteName} (ID: ${athleteId})? This cannot be undone.`)) {
            return; // Stop if user cancels
        }

        // setError(null); // Clear previous local errors if using local state

        // Wrap the server action call in startTransition
        startTransition(async () => {
            const result = await deleteAthleteAction(athleteId);
            if (result.success) {
                console.log(result.message);
                onDeleted(athleteId); // Notify parent list
            } else {
                console.error("Deletion failed:", result.message, result.error);
                onError(athleteId, result.message); // Notify parent list of error
                // setError(result.message); // Set local error state if preferred
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            // Styling using DaisyUI button classes
            className="btn btn-xs btn-ghost text-error hover:bg-error hover:text-error-content disabled:text-base-content/30 p-1" // Adjust padding/size
            disabled={isPending} // Disable button while action is pending
            title={`Delete ${athleteName}`}
            aria-label={`Delete athlete ${athleteName}`}
        >
            {isPending ? (
                // Show spinner when pending
                <span className="loading loading-spinner loading-xs"></span>
            ) : (
                // Show icon when not pending
                <TrashIcon className="h-4 w-4" />
            )}
        </button>
    );
}