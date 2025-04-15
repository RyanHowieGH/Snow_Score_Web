// src/app/admin/page.tsx (REMOVE "use client";)
// No "use client" here - this is now a Server Component

import Header from "../../components/header";
import EventList from "../../components/eventList";
import AdminLayout from "./eventLayout"; // NEW: Client component wrapper
import { fetchEvents } from "@/lib/data"; // Import the data fetching function (adjust path)
import Link from "next/link";

// This component now fetches data directly on the server
export default async function AdminPage() {
    // Fetch data directly. This happens on the server before rendering.
    // Error handling happens within fetchEvents()
    const events = await fetchEvents();

    return (
        // AdminLayout handles the client-side state (sidebar)
        <AdminLayout>
            {/* Content specific to this page */}
            <div className="flex flex-row items-center justify-between mb-6 px-4 md:px-6 lg:px-8 pt-4"> {/* Add padding */}
                <h2 className="text-2xl md:text-3xl font-bold">Events Dashboard</h2>
                <Link href="/admin/events/create" className="btn btn-primary">
                    Create Event
                </Link>
            </div>

            {/* Pass the server-fetched events to the EventList */}
            {/* EventList itself doesn't need state, just receives props */}
            <EventList events={events} />

        </AdminLayout>
    );
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Admin - Events Dashboard',
};

// Optional: Revalidate data periodically or on demand
// export const revalidate = 3600; // Revalidate every hour