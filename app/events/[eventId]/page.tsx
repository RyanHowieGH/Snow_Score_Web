import React from 'react';
import Link from 'next/link';
import { fetchEventById } from '@/lib/data'; // Your main data fetching function
import { formatDate, formatDateRange } from '@/lib/utils'; // Date utilities
import type { EventDetails } from '@/lib/definitions'; // Centralized type definitions
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server'; // Clerk's server-side auth helper
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your function to get DB role
import type { AppUserWithRole } from '@/lib/auth/user'; // Type for your app user with role
import type { Metadata } from 'next';
import BlankHeader from '@/components/blankHeader'; // Your public-facing header component
import {
    CalendarDaysIcon,
    MapPinIcon,
    FlagIcon,
    TrophyIcon,
    UsersIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';

// Props type for the page component
type PublicEventDetailPageProps = {
    params: { eventId: string };
};

// Function to generate dynamic metadata for SEO and browser tab
export async function generateMetadata({ params: paramsProp }: PublicEventDetailPageProps): Promise<Metadata> {
    const params = await paramsProp;
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) {
        return { title: 'Event Not Found | SnowScore' };
    }

    const event = await fetchEventById(eventId);

    if (!event) {
        return { title: 'Event Not Found | SnowScore' };
    }

    // Ensure dates are valid for formatting in description
    const startDateForDesc = event.start_date instanceof Date ? event.start_date : new Date(event.start_date);
    const endDateForDesc = event.end_date instanceof Date ? event.end_date : new Date(event.end_date);
    const formattedStartDate = formatDate(startDateForDesc); // Use your formatDate utility
    const formattedEndDate = formatDate(endDateForDesc);

    return {
        title: `${event.name} | Event Details | SnowScore`,
        description: `View details for the event: ${event.name}, taking place at ${event.location} from ${formattedStartDate} to ${formattedEndDate}.`,
        openGraph: {
            title: `${event.name} | SnowScore Event`,
            description: `Join or view details for ${event.name}, located at ${event.location}.`,
            type: 'article', // or 'event' if more appropriate for schema.org via Next.js
            // images: [ { url: event.imageUrl || '/default-event-image.jpg' } ], // Optional: Add an event image
        },
    };
}

// The main page component
export default async function PublicEventDetailPage({ params: paramsProp }: PublicEventDetailPageProps) {
    const params = await paramsProp;
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) {
        console.warn(`PublicEventDetailPage: Invalid eventId param received: ${params.eventId}`);
        notFound();
    }

    // Fetch all event details using your comprehensive fetchEventById
    const event: EventDetails | null = await fetchEventById(eventId);

    if (!event) {
        console.warn(`PublicEventDetailPage: Event not found in database for ID: ${eventId}`);
        notFound();
    }

    // --- ADMIN CHECK USING DATABASE ROLE ---
    // This part determines if an "Admin: Manage Event" button should be shown
    const authResult = await auth(); // Clerk's auth() returns a Promise of AuthObject
    const clerkUserId = authResult.userId;

    let isAdmin = false;
    if (clerkUserId) {
        // Assuming getAuthenticatedUserWithRole internally uses clerkUserId or fetches based on current session
        const appUser: AppUserWithRole | null = await getAuthenticatedUserWithRole();
        if (appUser) {
            // console.log(`PublicEventDetailPage: Fetched app user: ${appUser.email}, DB Role: ${appUser.roleName}`);
            const adminRoles = ['admin', 'Executive Director', 'Administrator', 'Chief of Competition']; // Define your admin roles
            isAdmin = adminRoles.includes(appUser.roleName);
        } else {
            // console.warn(`PublicEventDetailPage: User ${clerkUserId} authenticated with Clerk but no corresponding user/role found in application database.`);
        }
    }
    // --- END ADMIN CHECK ---

    // Ensure dates are Date objects for formatting
    const startDate = event.start_date instanceof Date ? event.start_date : new Date(event.start_date);
    const endDate = event.end_date instanceof Date ? event.end_date : new Date(event.end_date);

    return (
        <main className="bg-base-200 min-h-screen">
            <BlankHeader /> {/* Your public header component */}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="bg-base-100 p-6 md:p-10 rounded-2xl shadow-xl">
                    {/* Event Card Header */}
                    <div className="border-b border-base-300 pb-6 mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            {/* Left side: Event Name and Location */}
                            <div className="flex-grow">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight leading-tight">
                                    {event.name} 
                                </h1>
                                <p className="mt-2 text-lg sm:text-xl text-base-content opacity-80 flex items-center">
                                    <MapPinIcon className="h-5 w-5 mr-2 opacity-70" />
                                    {event.location}
                                </p>
                            </div>

                            {/* Right side: Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 sm:mt-0 self-start sm:self-auto">
                                <Link
                                    href="/" // Link to the homepage (or /events if that's your main event list)
                                    className="btn btn-outline btn-sm whitespace-nowrap"
                                    title="Return to events list"
                                >
                                    <ArrowUturnLeftIcon className="h-4 w-4 mr-1.5" />
                                    All Events
                                </Link>

                                {isAdmin && (
                                    <a // Using <a> for a full page navigation to the admin section
                                        href={`/admin/events/${eventId}`} // Link to admin dashboard for this event
                                        className="btn btn-accent btn-sm whitespace-nowrap"
                                        title="Manage this event in the admin panel"
                                    >
                                        <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                                        Admin: Manage
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Core Event Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        <InfoCard icon={<CalendarDaysIcon className="h-6 w-6 text-secondary" />} title="Dates" value={formatDateRange(startDate, endDate)} />
                        <InfoCard
                            icon={<FlagIcon className="h-6 w-6 text-secondary" />}
                            title="Status"
                            value={event.status || 'N/A'}
                            isBadge={true}
                            badgeClass={
                                event.status?.toLowerCase() === 'scheduled' ? 'badge-success' :
                                event.status?.toLowerCase() === 'completed' ? 'badge-primary' :
                                event.status?.toLowerCase() === 'cancelled' ? 'badge-error' :
                                'badge-ghost'
                            }
                        />
                        <InfoCard icon={<TrophyIcon className="h-6 w-6 text-secondary" />} title="Discipline" value={event.discipline_name || 'Not Specified'} />
                    </div>

                    {/* Divisions Section */}
                    {event.divisions && event.divisions.length > 0 && (
                        <Section title="Event Divisions">
                            <div className="flex flex-wrap gap-3">
                                {event.divisions.map((division) => (
                                    <span key={division.division_id} className="badge badge-lg badge-outline border-base-content/30 text-base-content py-3 px-4">
                                        {division.division_name}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Registered Athletes/Participants Section */}
                    <Section title="Participants">
                        {event.athletes && event.athletes.length > 0 ? (
                            <div className="overflow-x-auto bg-base-200/30 p-4 rounded-lg shadow-inner">
                                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                                    {event.athletes.map(athlete => (
                                        <li key={athlete.athlete_id} className="text-base-content py-1.5 flex items-center border-b border-base-300/50 last:border-b-0 sm:last:border-b sm:border-b-base-300/50">
                                            <UsersIcon className="h-4 w-4 mr-2 opacity-60 flex-shrink-0" />
                                            <span>
                                                {athlete.first_name} {athlete.last_name}
                                                {athlete.bib_num && <span className="text-xs opacity-70 ml-1">(Bib #{athlete.bib_num})</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex items-center text-base-content/70 italic p-4 bg-base-200/30 rounded-lg">
                                <InformationCircleIcon className="h-5 w-5 mr-2"/>
                                Participant list is not yet available or no athletes are registered.
                            </div>
                        )}
                    </Section>
                    <Section title="Results">
                        <p className="text-base-content/70 italic">Results will be available here after the event concludes.</p>
                    </Section>
                    {/* You could add more sections here: Schedule, Results (if completed), etc. */}
                </div>
            </div>
        </main>
    );
}

// --- Helper Components (defined in the same file for simplicity of this example) ---

// Helper component for consistent info card styling
const InfoCard: React.FC<{ icon: React.ReactNode; title: string; value: string; isBadge?: boolean; badgeClass?: string }> = ({ icon, title, value, isBadge, badgeClass }) => (
    <div className="bg-base-200/40 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center mb-1.5">
            {icon}
            <h3 className="ml-2.5 text-xs font-bold uppercase text-base-content/70 tracking-wider">{title}</h3>
        </div>
        {isBadge ? (
            <p className="mt-1 text-lg">
                <span className={`badge ${badgeClass || 'badge-ghost'} py-3 px-3 text-sm`}>{value}</span>
            </p>
        ) : (
            <p className="mt-1 text-lg text-base-content font-semibold">{value}</p>
        )}
    </div>
);

// Helper component for consistent section styling
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8 md:mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-secondary border-b border-base-300 pb-2">
            {title}
        </h2>
        {children}
    </div>
);