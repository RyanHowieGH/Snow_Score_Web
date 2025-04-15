// /app/admin/page.js (Corrected - Page Content Only)
'use client'; // Keep 'use client' if you need client-side interactivity WITHIN the page content (though not needed for just links)

// REMOVE Header/Sidebar imports and useState
// import Header from "../../components/header";
// import Sidebar from "../../components/sidebar";
// import React, { useState } from 'react';
import React from 'react'; // Keep React import
import Link from 'next/link';

export default function AdminDashboardPage() { // Renamed component for clarity
    // REMOVE state and toggle function
    // const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // const toggleSidebar = () => {
    //     setIsSidebarOpen(!isSidebarOpen);
    // };

    // Return ONLY the content for the main area
    return (
        // REMOVE the outer layout divs, Header, Sidebar rendering
        // <div className="flex flex-col h-screen"> ... <Header /> ... <div className="flex flex-1 overflow-hidden"> ... <Sidebar /> ... <main> ... </main> ... </div> ... </div>

        // Just return the content that should go inside the <main> tag rendered by the layout
        <div className="flex flex-col items-center justify-center pt-10"> {/* Add padding/margin as needed */}
            <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
            <p className="text-lg mb-8">Manage your events and athletes</p>
            {/* Use standard button size or adjust styling */}
            <div className="flex flex-wrap justify-center gap-4">
                 <Link href="/events" className="btn btn-lg btn-accent">Events</Link> {/* Example styling */}
                 <Link href="/admin/users" className="btn btn-lg btn-accent">Users</Link> {/* Link to new user page */}
                 <Link href="/athletes" className="btn btn-lg btn-accent">Athletes</Link>
            </div>

            {/* Remove or keep the tall content div for testing scrolling */}
            {/* <div className="h-[150vh] bg-blue-200 w-full mt-10">
                <p className="p-4">Very tall content to demonstrate scrolling...</p>
            </div> */}
        </div>
    );
}