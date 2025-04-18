// components/DeleteAthleteButton.tsx
'use client';

import React, { useTransition } from 'react';
import { deleteAthleteAction } from '@/app/admin/(standard)/athletes/actions';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteAthleteButtonProps {
    athleteId: number;
    athleteName: string; // For confirmation message
    onDeleted: (athleteId: number) => void; // Callback after successful deletion
    onError: (athleteId: number, message: string) => void; // Callback for errors
}

export default function DeleteAthleteButton({
    athleteId,
    athleteName,
    onDeleted,
    onError
}: DeleteAthleteButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        if (!window.confirm(`Are you sure you want to permanently delete athlete: ${athleteName} (ID: ${athleteId})? This cannot be undone.`)) {
            return;
        }

        startTransition(async () => {
            const result = await deleteAthleteAction(athleteId);
            if (result.success) {
                console.log(result.message);
                onDeleted(athleteId); // Notify parent list
            } else {
                console.error("Deletion failed:", result.message, result.error);
                onError(athleteId, result.message); // Notify parent list of error
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="btn btn-xs btn-ghost text-error hover:bg-error hover:text-error-content disabled:text-base-content/30 p-1"
            disabled={isPending}
            title={`Delete ${athleteName}`}
            aria-label={`Delete athlete ${athleteName}`}
        >
            {isPending ? (
                <span className="loading loading-spinner loading-xs"></span>
            ) : (
                <TrashIcon className="h-4 w-4" />
            )}
        </button>
    );
}