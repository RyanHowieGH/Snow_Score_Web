// components/AdminLayoutClientWrapper.tsx
'use client'; // This component manages state, must be client

import React, { useState, ReactNode } from 'react';
import Header from '@/components/header'; // Adjust paths
import Sidebar from '@/components/sidebar';
import type { ClientUser } from './ClientSideAuthWrapper';

interface AdminLayoutClientWrapperProps {
    children: ReactNode;
    user: ClientUser | null; // Receive the user data pre-fetched by the server layout
}

export default function AdminLayoutClientWrapper({ children, user }: AdminLayoutClientWrapperProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state lives here

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header /* user={user} */ />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar receives state, toggle function, AND user data */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    user={user} // Pass user down
                />
                {/* Main content area */}
                <main className="flex-1 bg-base-100 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children} {/* Render the actual page content */}
                </main>
            </div>
        </div>
    );
}