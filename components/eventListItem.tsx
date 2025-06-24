'use client'; // <-- MAKE THIS A CLIENT COMPONENT

import React, { useState, useTransition } from "react";
import Link from 'next/link';
import { formatDateRange } from '@/lib/utils';
import type { SnowEvent } from '@/lib/definitions';
import { deleteEventAction } from '@/app/admin/(detail)/events/actions'; // Adjust path if your action is elsewhere
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline'; // Example icons
// import { useRouter } from "next/navigation"; // For re-fetching data

interface EventListItemProps {
    event: SnowEvent;
    isUpcoming: boolean;
    baseUrl?: string;
    linkActionText?: string;
    linkActionSuffix?: string;
    isAdminView?: boolean; // New prop to indicate if this is rendered in an admin context
}

const EventListItem: React.FC<EventListItemProps> = ({
    event,
    isUpcoming,
    baseUrl = '/events',
    linkActionText = 'View Details',
    linkActionSuffix = '',
    isAdminView = false // Default to false
}) => {
    // const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();

    const startDate = typeof event.start_date === 'string' ? new Date(event.start_date) : event.start_date;
    const endDate = typeof event.end_date === 'string' ? new Date(event.end_date) : event.end_date;
    const formattedDate = formatDateRange(startDate, endDate);

    const eventUrl = `${baseUrl}/${event.event_id}${linkActionSuffix}`;

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the event "${event.name}"? This action cannot be undone.`)) {
            return;
        }
        setIsDeleting(true);
        setError(null);
        startDeleteTransition(async () => {
            const result = await deleteEventAction(event.event_id);
            setIsDeleting(false);
            if (!result.success) {
                setError(result.message || "Failed to delete event.");
                // Optionally, clear error after a few seconds
                setTimeout(() => setError(null), 5000);
            } else {
                // Success! Revalidation should update the list.
                // For a more immediate UI update, you might need to manage the list state in the parent
                // or trigger a router.refresh() if the parent component re-fetches data.
                // RevalidatePath in action is the primary way.
                // router.refresh(); // Uncomment if revalidatePath isn't updating UI quickly enough
                alert(result.message); // Or use a toast notification
            }
        });
    };

    return (
        <li className="bg-base-100 shadow-md rounded-lg transition-shadow hover:shadow-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                {/* Event Info and Main Link */}
                <Link href={eventUrl} className="flex-grow group">
                    <div className="text-lg font-semibold text-primary group-hover:underline">{event.name}</div>
                    <div className="text-sm text-base-content opacity-70">{event.location}</div>
                    <div className="text-xs uppercase font-medium text-base-content opacity-60 mt-1">
                        <span>{formattedDate}</span>
                    </div>
                </Link>

                {/* Action Buttons Area */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                    {isUpcoming && (
                        <div className="badge badge-info badge-outline badge-sm py-3 px-2 w-full justify-center sm:w-auto">
                            UPCOMING
                        </div>
                    )}
                    {!isUpcoming && (
                        <div className="badge badge-ghost badge-outline badge-sm py-3 px-2 w-full justify-center sm:w-auto">
                            PAST
                        </div>
                    )}

                    {/* Main Action Button (View/Manage) */}
                    <Link href={eventUrl} className="btn btn-sm btn-primary btn-outline w-full sm:w-auto">
                        {linkActionText === "Manage" && <PencilIcon className="h-4 w-4 mr-1 inline-block"/>}
                        {linkActionText}
                    </Link>

                    {/* Admin-only Delete Button */}
                    {isAdminView && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || isDeletePending}
                            className="btn btn-sm btn-error btn-outline w-full sm:w-auto"
                            title={`Delete event: ${event.name}`}
                        >
                            {isDeleting || isDeletePending ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <TrashIcon className="h-4 w-4" />
                            )}
                            <span className="sm:hidden ml-2">Delete</span> {/* Text for small screens */}
                        </button>
                    )}
                </div>
            </div>
            {error && <p className="text-xs text-error mt-2 text-center sm:text-right">{error}</p>}
        </li>
    );
};

export default EventListItem;