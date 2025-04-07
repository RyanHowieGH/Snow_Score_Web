// src/app/admin/events/[eventId]/page.tsx
import { fetchEventById, formatDateRange, Division, RegisteredAthlete } from "@/lib/data"; // Import updated types/functions
import { notFound } from 'next/navigation';
import Link from 'next/link';
// REMOVE THIS IMPORT: import SingleEventLayout from "./layout";

interface EventDashboardPageProps {
    params: {
        eventId: string;
    };
}

export default async function EventDashboardPage({ params }: EventDashboardPageProps) {
    const eventId = parseInt(params.eventId, 10);
     if (isNaN(eventId)) {
        console.error("Invalid event ID in URL:", params.eventId);
        notFound();
     }

    const eventDetails = await fetchEventById(eventId);

    if (!eventDetails) {
        notFound();
    }

    const formattedDateRange = formatDateRange(eventDetails.start_date, eventDetails.end_date);

    // --- CHANGE: Return ONLY the page-specific content ---
    return (
        <div className="space-y-6"> {/* This div is the direct child passed to the layout */}
            <h2 className="text-3xl font-bold">{eventDetails.name}</h2>

            {/* Event Info Card */}
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h3 className="card-title text-lg">Event Details</h3>
                    <p><span className="font-semibold">Dates:</span> {formattedDateRange}</p>
                    <p><span className="font-semibold">Location:</span> {eventDetails.location}</p>
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
                                    <Link
                                        href={`/admin/events/${eventId}/divisions/${encodeURIComponent(division.division_id)}`}
                                        className="link link-hover link-primary"
                                    >
                                        {division.division_name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">No divisions have been assigned to this event yet.</p>
                    )}
                     <div className="card-actions justify-end mt-4">
                        <Link href={`/admin/events/${eventId}/manage-divisions`} className="btn btn-sm btn-outline">
                            Manage Event Divisions
                        </Link>
                     </div>
                </div>
            </div>

{/* --- NEW: Registered Athletes Card --- */}
<div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h3 className="card-title text-lg">Registered Athletes</h3>
                    {eventDetails.athletes.length > 0 ? (
                        <ul className="list-none space-y-2"> {/* Using list-none for less indentation */}
                            {eventDetails.athletes.map((athlete: RegisteredAthlete) => (
                                <li key={athlete.athlete_id} className="flex justify-between items-center">
                                    {/* Optional: Link to athlete detail page */}
                                    {/* <Link href={`/admin/athletes/${athlete.athlete_id}`}> */}
                                        <span>{athlete.first_name} {athlete.last_name}</span>
                                    {/* </Link> */}
                                    {athlete.bib_num && (
                                        <span className="badge badge-ghost badge-sm">
                                            Bib: {athlete.bib_num}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">No athletes registered for this event yet.</p>
                    )}
                     <div className="card-actions justify-end mt-4">
                        {/* Link to a future page for managing athlete registrations for this event */}
                        <Link href={`/admin/events/${eventId}/manage-athletes`} className="btn btn-sm btn-outline">
                            Manage Athletes
                        </Link>
                     </div>
                </div>
            </div>
        </div>
    );
    // --- END CHANGE ---
}

// Metadata function remains the same
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