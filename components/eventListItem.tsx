// src/components/eventListItem.tsx
import React from "react";
import Link from 'next/link';
import { formatDateRange } from '@/lib/data'; // Import from lib/data.ts

// SnowEvent interface defined in lib/data.ts is re-exported there,
// but also defined here for clarity if this component needs it independently.
// Best practice would be to import it from lib/data.ts if it's the single source of truth.
// import type { SnowEvent } from '@/lib/data';
// For now, assuming the local definition is used or you manage the import.
export interface SnowEvent {
    event_id: number;
    name: string;
    start_date: Date; // Expect this to be a Date object
    end_date: Date;   // Expect this to be a Date object
    location: string;
}

interface EventListItemProps {
    event: SnowEvent;
    isUpcoming: boolean;
}

const EventListItem: React.FC<EventListItemProps> = ({ event, isUpcoming }) => {
    // Assuming event.start_date and event.end_date are already Date objects
    // as fetchEvents in lib/data.ts converts them.
    const formattedDate = formatDateRange(event.start_date, event.end_date);
    const eventUrl = `/events/${event.event_id}`;

    return (
        <li>
            <Link
                href={eventUrl}
                className="flex justify-between items-center w-full p-4 hover:bg-base-200 focus:bg-base-300 focus:outline-none rounded-lg transition-colors duration-150 cursor-pointer"
                aria-label={`View details for ${event.name}`}
            >
                <div className="flex-grow mr-4">
                    <div className="text-lg font-medium">{event.name}</div>
                    <div className="text-sm text-gray-600">{event.location}</div>
                    <div className="text-sm uppercase font-semibold opacity-70 mt-1 flex items-center flex-wrap">
                        <span>{formattedDate}</span>
                        {isUpcoming && (
                            <div className="badge badge-info badge-outline badge-sm ml-2 mt-1 sm:mt-0">
                                UPCOMING
                            </div>
                        )}
                        {!isUpcoming && (
                            <div className="badge badge-ghost badge-outline badge-sm ml-2 mt-1 sm:mt-0">
                                PAST
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <span className="btn btn-sm btn-outline btn-primary">
                        Go To Event
                    </span>
                </div>
            </Link>
        </li>
    );
};

export default EventListItem;