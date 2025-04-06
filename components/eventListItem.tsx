// src/components/eventListItem.tsx
import React from "react";
import Link from 'next/link'; // Import Link

// Define and export the type for the event data (using event_id)
export interface SnowEvent {
    event_id: number;
    name: string;
    start_date: Date;
    end_date: Date;
    location: string;
}

interface EventListItemProps {
    event: SnowEvent;
    isUpcoming: boolean;
}

// Helper function to format date ranges (remains the same)
const formatDateRange = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid Date";
    const startDateStr = start.toLocaleDateString("en-US", options);
    const endDateStr = end.toLocaleDateString("en-US", options);
    if (startDateStr === endDateStr) return startDateStr;
    const startMonthYear = start.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    const endMonthYear = end.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    if (startMonthYear === endMonthYear) {
        const startDay = start.getDate();
        const endDay = end.getDate();
        return `${start.toLocaleDateString("en-US", { month: 'short' })} ${startDay}-${endDay}, ${start.getFullYear()}`;
    }
    return `${startDateStr} - ${endDateStr}`;
};


const EventListItem: React.FC<EventListItemProps> = ({ event, isUpcoming }) => {
    const formattedDate = formatDateRange(event.start_date, event.end_date);
    // Define the target URL for the event link
    const eventUrl = `/admin/events/${event.event_id}`; // Adjust path if your event detail page is different

    return (
        // The <li> still provides the list structure
        <li>
            {/* Link wraps the entire content, making it clickable */}
            <Link
                href={eventUrl}
                // Apply flex, padding, hover effects etc., directly to the link
                // Replace 'list-row' styling here
                className="flex justify-between items-center w-full p-4 hover:bg-base-200 focus:bg-base-300 focus:outline-none rounded-lg transition-colors duration-150 cursor-pointer"
                aria-label={`View details for ${event.name}`} // Accessibility
            >
                {/* Event Details Container (takes up available space) */}
                <div className="flex-grow mr-4"> {/* Added margin-right for spacing */}
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

                {/* "Go To Event" Button-like Text (doesn't shrink) */}
                <div className="flex-shrink-0">
                    <span className="btn btn-sm btn-outline btn-primary"> {/* Use span styled as button */}
                        Go To Event
                    </span>
                </div>
            </Link>
        </li>
    );
};

export default EventListItem;