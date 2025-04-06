// src/app/admin/events/[eventId]/page.tsx
import { fetchEventById, formatDateRange, Division } from "@/lib/data"; // Import updated types/functions
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SingleEventLayout from "./layout"; // Keep using the specific layout

interface EventDashboardPageProps {
    params: {
        eventId: string;
    };
}

export default async function EventDashboardPage({ params }: EventDashboardPageProps) {
    // eventId from params is string, convert to number for DB query
    const eventId = parseInt(params.eventId, 10);
     if (isNaN(eventId)) {
        // Handle cases where the URL segment isn't a valid number
        console.error("Invalid event ID in URL:", params.eventId);
        notFound();
     }

    // Fetch event data using the updated function
    const eventDetails = await fetchEventById(eventId);

    if (!eventDetails) {
        notFound();
    }

    // Use the imported helper function for date range formatting
    const formattedDateRange = formatDateRange(eventDetails.start_date, eventDetails.end_date);

    return (
        <SingleEventLayout eventName={eventDetails.name} eventId={eventId}>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Dashboard</h2>

                {/* Event Info Card */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h3 className="card-title text-lg">Event Details</h3>
                        <p><span className="font-semibold">Dates:</span> {formattedDateRange}</p>
                        <p><span className="font-semibold">Location:</span> {eventDetails.location}</p>
                        {/* You could add Discipline here later if needed */}
                        {/* <p><span className="font-semibold">Status:</span> {eventDetails.status}</p> */}
                    </div>
                </div>

                {/* Divisions Card */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h3 className="card-title text-lg">Divisions</h3>
                        {eventDetails.divisions.length > 0 ? (
                            <ul className="list-disc list-inside space-y-2">
                                {eventDetails.divisions.map((division: Division) => (
                                    <li key={division.division_id}>
                                        {/* Link uses the TEXT division_id from the division object */}
                                        <Link
                                            href={`/admin/events/${eventId}/divisions/${encodeURIComponent(division.division_id)}`} // Ensure division_id is URL-encoded if it contains special chars
                                            className="link link-hover link-primary"
                                        >
                                            {division.division_name} {/* Display the division name */}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No divisions have been assigned to this event yet.</p>
                        )}
                         <div className="card-actions justify-end mt-4">
                            {/* Link to a page for managing division assignments for this event */}
                            <Link href={`/admin/events/${eventId}/manage-divisions`} className="btn btn-sm btn-outline">
                                Manage Event Divisions
                            </Link>
                         </div>
                    </div>
                </div>

                {/* Placeholder for future dashboard content */}
                {/* <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h3 className="card-title text-lg">Quick Stats</h3>
                        <p>Registered Athletes: X</p>
                        <p>Judges Assigned: Y</p>
                    </div>
                </div> */}

            </div>
        </SingleEventLayout>
    );
}

// Update generateMetadata to use the refactored fetch function
export async function generateMetadata({ params }: EventDashboardPageProps) {
  const eventId = parseInt(params.eventId, 10);
   if (isNaN(eventId)) {
      return { title: 'Invalid Event' };
   }
  const eventDetails = await fetchEventById(eventId);

  if (!eventDetails) {
    return { title: 'Event Not Found' };
  }

  return {
    title: `Dashboard - ${eventDetails.name}`,
  };
}