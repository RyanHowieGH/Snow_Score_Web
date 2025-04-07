// src\app\admin\page.js
'use client';
import Header from "../../components/header";
import Sidebar from "../../components/sidebar"; // Import the Sidebar
import React, { useState } from 'react';
import Link from 'next/link';

export default function Admin() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Start open or closed?

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen"> {/* Ensure outer container takes full height */}
            <Header />

            {/* Container for Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden"> {/* flex-1 allows this div to grow and fill remaining height */}

                {/* Render the Sidebar */}
                {/* It will take its width based on its internal state */}
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                {/* Main Content Area */}
                {/* flex-1 allows it to take remaining width */}
                {/* overflow-y-auto enables scrolling ONLY for the main content if it overflows */}
                <main className="flex-1 bg-gray-100 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col items-center justify-center"> {/* Removed padding from here, added to main */}
                        <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
                        <p className="text-lg mb-8">Manage your events and athletes</p>
                        <Link href="/events" className="btn btn-xl btn-white m-2">Events</Link>
                        <Link href="/athletes" className="btn btn-xl btn-white m-2">Athletes</Link>
                    </div>
                </main>
            </div>
        </div>
    );
}