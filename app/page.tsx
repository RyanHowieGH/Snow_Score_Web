// app/page.tsx
import EventList from "@/components/EventList";
import { fetchEvents } from "@/lib/data";
import type { Metadata } from 'next';
import BlankHeader from "@/components/blankHeader";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "SnowScore - Ski & Snowboard Competition Management",
    description: "The new way to track, manage, and follow snowboarding and skiing events. Score tracking, live updates, and more.",
};

export default async function HomePage() {
  const events = await fetchEvents();
  const publicEvents = events.filter(event => event.status === 'Active');

  return (
    // RESPONSIVE: Set a background color for the whole page. The gradient will be on the hero.
    <main className="min-h-screen bg-base-200 flex flex-col">
      <BlankHeader />

      {/* Hero Section */}
      <div className="flex-grow">
      {/* RESPONSIVE: Gradient is now here. We use `w-full` and `container` with `px-4` for consistent padding. */}
      <div className="w-full bg-gradient-to-br from-primary to-secondary text-primary-content text-center py-2 sm:py-4 lg:py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto"> {/* Centering content with a max-width */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
              Welcome to SnowScore
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl opacity-90 animate-fade-in-up animation-delay-300">
              The ultimate platform for ski & snowboard competitions.
            </p>
          </div>
        </div>
      </div>

      {/* Events List Section */}
      {/* RESPONSIVE: `container` and `px` ensure consistent padding that matches the hero section. */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {events.length > 0 ? (
          <EventList
            events={publicEvents}
            title="Discover Upcoming Events"
            showCreateButton={false}
            noEventsMessage="Stay tuned! More exciting events coming soon."
            // RESPONSIVE: Reduced vertical spacing on the list items for a tighter mobile view.
            className="space-y-4 md:space-y-6"
          />
        ) : (
          <div className="text-center p-8 sm:p-10 bg-base-100 rounded-box shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">No Events Scheduled</h2>
            <p className="text-base-content/80">
              It looks like there are no events at the moment. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
      {/* Footer (Example) */}
      <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-8">
        <aside>
          <p>© {new Date().getFullYear()} SnowScore - All rights reserved.</p>
        </aside>
      </footer>
    </main>
  );
}