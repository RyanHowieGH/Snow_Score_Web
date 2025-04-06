
// src\app\events\eventLayout.tsx
"use client"; // This component needs client-side interactivity (useState)

import React, { useState } from "react";
import Header from "../../components/header"; // Adjust path if needed
import Sidebar from "../../components/sidebar"; // Adjust path if needed

interface EventLayoutProps {
    children: React.ReactNode; // To render the page content
}

export default function EventLayout({ children }: EventLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100"> {/* Added bg color */}
            {/* Pass toggle function to Header if Header contains the toggle button */}
            <Header /* onToggleSidebar={toggleSidebar} */ />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar state is managed here */}
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                {/* Main content area - renders the children passed from the page */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children} {/* Render the actual page content here */}
                </main>
            </div>
        </div>
    );
}