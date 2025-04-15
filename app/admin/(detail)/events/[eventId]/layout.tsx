// app/admin/(detail)/events/[eventId]/layout.tsx (REVISED - Simpler)
'use client'; // Needs client state for sidebar toggle

import React, { useState } from "react";
import Header from "@/components/header"; // Adjust path
import EventSidebar from "@/components/eventSidebar"; // Adjust path
import { useParams } from "next/navigation"; // Hook to get params client-side
// Fetching data client-side in layout is generally discouraged,
// but acceptable for simple things like event name for the header if needed,
// or rely on page data passed via context/state management if complex.
// For now, let's assume Header doesn't NEED eventName immediately or page handles title.

interface EventDetailLayoutProps {
    children: React.ReactNode;
}

export default function EventDetailLayout({ children }: EventDetailLayoutProps) {
    const params = useParams();
    const eventId = params.eventId as string; // Get eventId from dynamic route

    // State for the event-specific sidebar
    const [isEventSidebarOpen, setIsEventSidebarOpen] = useState(true);
    const toggleEventSidebar = () => setIsEventSidebarOpen(!isEventSidebarOpen);

    // We might not have eventName readily available here without an extra fetch
    // The Header component was modified to make eventName optional
    const eventName = "Event Details"; // Placeholder or fetch later/use page title

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Render event-specific header (might need name later) */}
            <Header eventName={eventName} />
            <div className="flex flex-1 overflow-hidden">
                {/* Render the event-specific sidebar */}
                <EventSidebar
                    isOpen={isEventSidebarOpen}
                    toggleSidebar={toggleEventSidebar}
                    eventId={eventId} // Pass eventId from params
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children} {/* Render the actual page content */}
                </main>
            </div>
        </div>
    );
}

// Remove the separate SingleEventLayout.tsx component file if this replaces its functionality.