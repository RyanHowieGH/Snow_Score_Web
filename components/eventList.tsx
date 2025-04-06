// src/components/EventList.tsx
import React from "react";
import EventListItem, { SnowEvent } from "./eventListItem"; // Import type and component
import Link from 'next/link'; // Import Link

interface EventListProps {
    events: SnowEvent[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Compare date part only

    const upcomingEvents = events
        .filter(event => event.end_date >= now) // Use Date objects directly
        .sort((a, b) => a.start_date.getTime() - b.start_date.getTime()); // Sort upcoming ascending

    const previousEvents = events
        .filter(event => event.end_date < now)
        .sort((a, b) => b.start_date.getTime() - a.start_date.getTime()); // Sort previous descending

    return (
        <div className="flex flex-col items-center w-full space-y-8 max-w-2xl mx-auto"> {/* Added spacing & max-width */}

            {/* Upcoming Events Section */}
            <section className="w-full">
                <h3 className="text-xl font-semibold mb-3 opacity-80 px-1">Upcoming Events</h3>
                {upcomingEvents.length > 0 ? (
                    <ul className="list bg-base-100 rounded-box shadow-lg w-full"> {/* Increased shadow */}
                        {upcomingEvents.map((event) => (
                            <EventListItem key={`upcoming-${event.event_id}`} event={event} isUpcoming={true} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-6 bg-base-100 rounded-box shadow">
                        <p className="text-gray-500">No upcoming events found.</p>
                        <Link href="/admin/events/create" className="btn btn-sm btn-outline mt-4">
                            Create New Event
                        </Link>
                    </div>
                )}
            </section>

            {/* Previous Events Section */}
             <section className="w-full">
                <h3 className="text-xl font-semibold mb-3 opacity-80 px-1">Previous Events</h3>
                {previousEvents.length > 0 ? (
                    <ul className="list bg-base-100 rounded-box shadow-lg w-full">
                        {/* Optional: Add header row if needed */}
                        {/* <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Previous Events</li> */}
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