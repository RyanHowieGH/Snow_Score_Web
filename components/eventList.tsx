// src/components/EventList.tsx
import React from "react";
import EventListItem, { SnowEvent } from "./eventListItem";
import Link from 'next/link';

interface EventListProps {
    events?: SnowEvent[];
    showCreateButton?: boolean; // Add this new prop (optional)
}

const EventList: React.FC<EventListProps> = ({
    events = [],
    showCreateButton = true // Default to true if not provided
}) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Compare date part only

    const upcomingEvents = events
        .filter(event => event.end_date >= now)
        .sort((a, b) => a.start_date.getTime() - b.start_date.getTime());

    const previousEvents = events
        .filter(event => event.end_date < now)
        .sort((a, b) => b.start_date.getTime() - a.start_date.getTime());

    return (
        <div className="flex flex-col items-center w-full space-y-8 max-w-2xl mx-auto">

            {/* Upcoming Events Section */}
            <section className="w-full">
                <h3 className="text-xl font-semibold mb-3 opacity-80 px-1">Upcoming Events</h3>
                {upcomingEvents.length > 0 ? (
                    <ul className="list bg-base-100 rounded-box shadow-lg w-full">
                        {upcomingEvents.map((event) => (
                            <EventListItem key={`upcoming-${event.event_id}`} event={event} isUpcoming={true} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-6 bg-base-100 rounded-box shadow">
                        <p className="text-gray-500">No upcoming events found.</p>
                        {/* Conditionally render the Link based on the new prop */}
                        {showCreateButton && (
                            <Link href="/admin/events/create" className="btn btn-sm btn-outline mt-4">
                                Create New Event
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* Previous Events Section */}
             <section className="w-full">
                <h3 className="text-xl font-semibold mb-3 opacity-80 px-1">Previous Events</h3>
                {previousEvents.length > 0 ? (
                    <ul className="list bg-base-100 rounded-box shadow-lg w-full">
                        {previousEvents.map((event) => (
                            <EventListItem key={`previous-${event.event_id}`} event={event} isUpcoming={false} />
                        ))}
                    </ul>
                ) : (
                     <div className="text-center p-6 bg-base-100 rounded-box shadow">
                        <p className="text-gray-500">No previous events found.</p>
                     </div>
                )}
            </section>
        </div>
    );
};

export default EventList;