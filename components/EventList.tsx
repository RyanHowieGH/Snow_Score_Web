// src/components/EventList.tsx
import React from 'react';
import EventListItem from './eventListItem';
import type { SnowEvent } from '@/lib/definitions';
import Link from 'next/link';

interface EventListProps {
    events: SnowEvent[];
    title?: string;
    showCreateButton?: boolean;
    baseUrl?: string;
    linkActionText?: string;
    linkActionSuffix?: string;
    noEventsMessage?: string;
    className?: string;
    itemGridCols?: string;
    // NEW PROP: For title text color
    titleTextColor?: string;
}

const EventList: React.FC<EventListProps> = ({
    events,
    title = "Events",
    showCreateButton = false,
    baseUrl,
    linkActionText,
    linkActionSuffix,
    noEventsMessage,
    className = "space-y-8",
    itemGridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    titleTextColor = "text-base-content" // Default to base content color (usually dark on light bg)
}) => {
    const now = new Date();
    const upcomingEvents = events.filter(event => event.end_date >= now);
    const pastEvents = events.filter(event => event.end_date < now);

    upcomingEvents.sort((a, b) => a.start_date.getTime() - b.start_date.getTime());
    pastEvents.sort((a, b) => b.end_date.getTime() - a.end_date.getTime());

    const defaultNoEventsMessage = showCreateButton
        ? "No events found. Get started by creating one!"
        : "No events scheduled at this time.";

    if (events.length === 0) {
        return (
            <div className="text-center p-6 bg-base-100 rounded-box shadow-md">
                <p className={`text-xl ${titleTextColor} opacity-70`}>{noEventsMessage || defaultNoEventsMessage}</p>
                {showCreateButton && (
                    <Link href="/admin/events/create" className="btn btn-primary mt-6">
                        Create New Event
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Only render title if it's provided and not empty */}
            {title && title.trim() !== "" && (
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    {/* VVV --- CHANGED TEXT COLOR CLASS --- VVV */}
                    <h1 className={`text-3xl font-bold ${titleTextColor}`}>{title}</h1>
                    {showCreateButton && (
                        <Link href="/admin/events/create" className="btn btn-primary btn-md">
                            Create New Event
                        </Link>
                    )}
                </div>
            )}


            {upcomingEvents.length > 0 && (
                <section>
                    {/* VVV --- CHANGED TEXT COLOR CLASS --- VVV */}
                    <h2 className={`text-2xl font-semibold mb-6 ${titleTextColor} opacity-90`}>Upcoming Events</h2>
                    <ul className={`grid ${itemGridCols} gap-6`}>
                        {upcomingEvents.map(event => (
                            <EventListItem
                                key={event.event_id}
                                event={event}
                                isUpcoming={true}
                                baseUrl={baseUrl}
                                linkActionText={linkActionText}
                                linkActionSuffix={linkActionSuffix}
                            />
                        ))}
                    </ul>
                </section>
            )}

            {pastEvents.length > 0 && (
                <section className={upcomingEvents.length > 0 ? "mt-12 pt-8 border-t border-base-300" : ""}>
                    {/* VVV --- CHANGED TEXT COLOR CLASS --- VVV */}
                    <h2 className={`text-2xl font-semibold mb-6 ${titleTextColor} opacity-90`}>Past Events</h2>
                    <ul className={`grid ${itemGridCols} gap-6`}>
                        {pastEvents.map(event => (
                            <EventListItem
                                key={event.event_id}
                                event={event}
                                isUpcoming={false}
                                baseUrl={baseUrl}
                                linkActionText={linkActionText}
                                linkActionSuffix={linkActionSuffix}
                            />
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default EventList;