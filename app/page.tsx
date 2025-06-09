// app/page.tsx
// import PublicHeader from "@/components/public/PublicHeader"; // Assuming you've created/renamed this
import EventList from "@/components/EventList";     // Assuming EventList is in components/shared/
import { fetchEvents } from "@/lib/data";
import type { Metadata } from 'next';
import Link from 'next/link'; // For the "Get Started" button
import BlankHeader from "@/components/blankHeader";

export const metadata: Metadata = {
    title: "SnowScore - Ski & Snowboard Competition Management",
    description: "The new way to track, manage, and follow snowboarding and skiing events. Score tracking, live updates, and more.",
    // Add more metadata tags here if needed (e.g., OpenGraph for social sharing)
};

export default async function HomePage() {
  const events = await fetchEvents(); // Fetches SnowEvent[] with Date objects

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary to-secondary"> {/* Example gradient background */}
      {/* <PublicHeader /> */}
      <BlankHeader /> {/* Use your generic public header for the homepage */}

      {/* Hero Section */}
      <div className="py-12 md:py-16 bg-base-100 text-base-content"> {/* Outer container for background and vertical padding */}
        <div className="container mx-auto px-4"> {/* Centering content */}
          <div className="text-center md:text-left max-w-3xl mx-auto md:mx-0"> {/* Max width for text block & centering on small screens */}
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 animate-fade-in-down">
              Welcome to SnowScore
            </h1>
            <p className="text-md sm:text-lg opacity-80 animate-fade-in-up animation-delay-300">
              The ultimate platform for tracking, managing, and following snowboarding and skiing competitions.
              Real-time scores, detailed event breakdowns, and seamless organization.
            </p>
          </div>
        </div>
      </div>

      {/* Events List Section */}
      <div className="px-4 md:px-10 py-12 md:py-16 bg-base-200 text-base-content">
        <div className="container mx-auto">
          {events.length > 0 ? (
            <EventList
              events={events}
              title="Discover Events"
              showCreateButton={false} // No "Create Event" button on the public homepage
              // baseUrl, linkActionText, linkActionSuffix are not passed,
              // so EventListItem will use its defaults:
              // baseUrl: '/events'
              // linkActionText: 'View Details'
              // linkActionSuffix: ''
              noEventsMessage="Stay tuned! More exciting events coming soon."
              className="space-y-10" // Custom spacing for the list on homepage
            />
          ) : (
            <div className="text-center p-10 bg-base-100 rounded-box shadow-xl">
              <h2 className="text-2xl font-semibold mb-4">No Events Yet</h2>
              <p className="text-lg text-base-content opacity-70">
                It looks like there are no events scheduled at the moment.
                Please check back soon for updates!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer (Example - create a components/shared/Footer.tsx) */}
      {/* <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
          <p>© {new Date().getFullYear()} SnowScore - All rights reserved.</p>
        </aside>
      </footer> */}
    </main>
  );
}