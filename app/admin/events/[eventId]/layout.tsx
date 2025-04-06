// src/app/admin/events/[eventId]/layout.tsx
"use client"; // This layout needs client-side state for the sidebar

import React, { useState } from "react";
import Header from "../../../../components/header"; // Adjust path
import EventSidebar from "../../../../components/eventSidebar"; // Adjust path

interface SingleEventLayoutProps {
    children: React.ReactNode;
    // We'll get eventName and eventId from the page component via props
    eventName: string;
    eventId: number | string; // Can be string from params initially
}

export default function SingleEventLayout({ children, eventName, eventId }: SingleEventLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Pass eventName to the Header */}
            <Header eventName={eventName} />
            <div className="flex flex-1 overflow-hidden">
                {/* Use the EventSidebar, passing eventId and state */}
                <EventSidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    eventId={eventId}
                />
                {/* Main content area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children} {/* Render the specific page content */}
                </main>
            </div>
        </div>
    );
}

// NOTE: This layout is specific to pages *under* /admin/events/[eventId]/
// The main /admin/events page still uses eventLayout.tsx (which should probably use the general Sidebar)
// Consider renaming eventLayout.tsx to eventsListLayout.tsx for clarity if needed.