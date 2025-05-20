// app/page.js (Assuming Server Component structure from previous example)
import BlankHeader from "../components/blankHeader";
import EventList from "../components/EventList";
import { fetchEvents } from "../lib/data"; // Adjust path if lib is not a sibling of app

export default async function Home() {
  const events = await fetchEvents();

  return (
    <main>
      <BlankHeader/>
      {/* Hero section (reduced height example) */}
      <div className="hero bg-white items-start justify-center">
        <div className="hero-content pt-10 pl-10 pb-10">
          <div className="max-w-none">
            <h1 className="text-5xl font-bold">Welcome to SnowScore</h1>
            <p className="py-6">
              The new way to track snowboarding and skiing events.
            </p>
          </div>
        </div>
      </div>

      {/* Events List Section */}
      <div className="px-4 md:px-10 py-8 bg-white text-black">
        {events.length > 0 ? (
          // Pass the new prop here
          <EventList events={events} showCreateButton={false} />
        ) : (
          // If there are no events at all, EventList's internal logic for "No upcoming events"
          // will still trigger, but now it won't show the button.
          // You could also have a more specific message here if needed when events array is globally empty.
          <div className="text-center p-6 bg-base-100 rounded-box shadow">
            <p className="text-gray-500">No events found.</p>
            {/* The "Create New Event" button is now controlled by EventList's internal prop */}
          </div>
        )}
      </div>
    </main>
  );
}