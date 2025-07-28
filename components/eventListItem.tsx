// components\eventListItem.tsx

'use client';

import React, { useState, useTransition } from "react";
import Link from 'next/link';
// --- UPDATE THIS IMPORT ---
import { formatDateRange, getEventState } from '@/lib/utils';
import type { SnowEvent } from '@/lib/definitions';
import { deleteEventAction } from '@/app/admin/(detail)/events/actions';
import { TrashIcon, PencilIcon, ClockIcon, CheckCircleIcon, CalendarIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from "next/navigation";

interface EventListItemProps {
    event: SnowEvent;
    // --- 'isUpcoming' prop is NO LONGER NEEDED ---
    baseUrl?: string;
    linkActionText?: string;
    linkActionSuffix?: string;
    isAdminView?: boolean;
}

const EventListItem: React.FC<EventListItemProps> = ({
    event,
    baseUrl = '/events',
    linkActionText = 'View Details',
    linkActionSuffix = '',
    isAdminView = false
}) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();

    // Ensure start_date and end_date are Date objects
    const startDate = typeof event.start_date === 'string' ? new Date(event.start_date) : event.start_date;
    const endDate = typeof event.end_date === 'string' ? new Date(event.end_date) : event.end_date;
    
    // --- VVV NEW: Calculate the state directly in the component VVV ---
    const eventState = getEventState(startDate, endDate);

    const formattedDate = formatDateRange(startDate, endDate);
    const eventUrl = `${baseUrl}/${event.event_id}${linkActionSuffix}`;

    const handleDelete = async () => {
        // ... (handleDelete logic remains the same)
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
                setTimeout(() => setError(null), 5000);
            } else {
                alert(result.message);
            }
        });
    };

    // --- VVV NEW: Define badge properties based on database status first, then date state VVV ---
    const getBadgeProps = () => {
        // If the event is Inactive in the database, show that regardless of date
        if (event.status === 'Inactive') {
            return {
                text: 'INACTIVE',
                className: 'badge-error',
                icon: <XCircleIcon className="h-3 w-3 mr-1" />
            };
        }

        // For Active events, show date-based status
        switch (eventState) {
            case 'ONGOING':
                return {
                    text: 'ONGOING',
                    className: 'badge-success',
                    icon: <ClockIcon className="h-3 w-3 mr-1" />
                };
            case 'COMPLETE':
                return {
                    text: 'COMPLETE',
                    className: 'badge-primary',
                    icon: <CheckCircleIcon className="h-3 w-3 mr-1" />
                };
            case 'UPCOMING':
            default:
                return {
                    text: 'UPCOMING',
                    className: 'badge-info',
                    icon: <CalendarIcon className="h-3 w-3 mr-1" />
                };
        }
    };
    const badge = getBadgeProps();


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
                    
                    {/* --- VVV UPDATED BADGE RENDERING VVV --- */}
                    <div className={`badge ${badge.className} badge-outline badge-sm py-3 px-2 w-full justify-center sm:w-auto flex flex-row items-center`}>
                        {badge.icon}
                        {badge.text}
                    </div>

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
                            <span className="sm:hidden ml-2">Delete</span>
                        </button>
                    )}
                </div>
            </div>
            {error && <p className="text-xs text-error mt-2 text-center sm:text-right">{error}</p>}
        </li>
    );
};

export default EventListItem;