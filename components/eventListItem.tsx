// src/components/EventListItem.tsx
import React from "react";
import Link from 'next/link';
import { formatDateRange } from '@/lib/utils'; // Assuming formatDateRange is moved to lib/utils.ts
import type { SnowEvent } from '@/lib/definitions'; // Import from centralized definitions

interface EventListItemProps {
    event: SnowEvent;
    isUpcoming: boolean;
    /** Base URL for the link, e.g., '/events' or '/admin/events'. Defaults to '/events'. */
    baseUrl?: string;
    /** Text for the action button/link, e.g., 'View Details' or 'Manage'. Defaults to 'View Details'. */
    linkActionText?: string;
    /** Optional suffix for the URL, e.g., '/edit'. Defaults to empty string. */
    linkActionSuffix?: string;
}

const EventListItem: React.FC<EventListItemProps> = ({
    event,
    isUpcoming,
    baseUrl = '/events', // Default to public event view path
    linkActionText = 'View Details',
    linkActionSuffix = '' // Default to no suffix
}) => {
    // Ensure dates are Date objects for formatDateRange.
    // This should ideally be handled when data is fetched and mapped to SnowEvent type.
    const startDate = typeof event.start_date === 'string' ? new Date(event.start_date) : event.start_date;
    const endDate = typeof event.end_date === 'string' ? new Date(event.end_date) : event.end_date;
    const formattedDate = formatDateRange(startDate, endDate);

    const eventUrl = `${baseUrl}/${event.event_id}${linkActionSuffix}`;

    return (
        <li className="bg-base-100 shadow-md rounded-lg transition-shadow hover:shadow-lg">
            <Link
                href={eventUrl}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full p-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                aria-label={`${linkActionText} for ${event.name}`}
            >
                <div className="flex-grow mr-4 mb-3 sm:mb-0">
                    <div className="text-lg font-semibold text-primary">{event.name}</div>
                    <div className="text-sm text-base-content opacity-70">{event.location}</div>
                    <div className="text-xs uppercase font-medium text-base-content opacity-60 mt-1">
                        <span>{formattedDate}</span>
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    {isUpcoming && (
                        <div className="badge badge-info badge-outline badge-sm w-full justify-center sm:w-auto">
                            UPCOMING
                        </div>
                    )}
                    {!isUpcoming && (
                        <div className="badge badge-ghost badge-outline badge-sm w-full justify-center sm:w-auto">
                            PAST
                        </div>
                    )}
                    <span className="btn btn-sm btn-primary btn-outline w-full sm:w-auto mt-2 sm:mt-0">
                        {linkActionText}
                    </span>
                </div>
            </Link>
        </li>
    );
};

export default EventListItem;