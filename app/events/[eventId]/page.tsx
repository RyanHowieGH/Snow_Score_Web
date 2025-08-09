// app/events/[eventId]/page.tsx

// app/events/[eventId]/page.tsx

import React from 'react';
import Link from 'next/link';
import { fetchEventById, fetchEventScheduleByEventId, fetchDivisionsAndRoundsByEventId } from '@/lib/data';
import { formatDate, formatDateRange, formatScheduleTime } from '@/lib/utils';
// --- VVV THIS IS THE FIX VVV ---
import type { EventDetails, UserWithRole, PublicScheduleItem, DivisionToMainEventPage } from '@/lib/definitions';
// --- ^^^ END OF FIX ^^^ ---
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import type { Metadata } from 'next';
import BlankHeader from '@/components/blankHeader';
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
import EventStatusBadge from '@/components/EventStatusBadge';

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
    if (isNaN(eventId)) notFound();

    const [event, schedule]: [EventDetails | null, PublicScheduleItem[]] = await Promise.all([
        fetchEventById(eventId),
        fetchEventScheduleByEventId(eventId)
    ]);

    if (!event) notFound();

    // --- ADMIN CHECK LOGIC ---
    const { userId } = await auth(); 
    let isAdmin = false;
    if (userId) {
        const appUser = await getAuthenticatedUserWithRole();
        if (appUser) {
            const adminRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
            isAdmin = adminRoles.includes(appUser.roleName);
        }
    }
    // --- END ADMIN CHECK ---

    if (event.status === 'Inactive' && !isAdmin) {
    notFound(); // Or redirect('/')
}

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const disciplineDisplay = [event.category_name, event.subcategory_name].filter(Boolean).join(' - ');

    // LIVE RESULTS

    const competitionData = await fetchDivisionsAndRoundsByEventId(parseInt(params.eventId));

    return (
        <main className="bg-base-200 min-h-screen">
            <BlankHeader />

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
                        <InfoCard icon={<FlagIcon className="h-6 w-6 text-secondary" />} title="Status">
                            <div className="mt-1">
                                <EventStatusBadge startDate={startDate} endDate={endDate} size="lg" />
                            </div>
                        </InfoCard>
                        <InfoCard 
                            icon={<TrophyIcon className="h-6 w-6 text-secondary" />} 
                            title="Discipline" 
                            value={disciplineDisplay || 'Not Specified'} 
                        />
                    </div>

                    {/* Schedule Section */}
                    <Section title="Event Schedule">
                        {schedule && schedule.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="text-xs uppercase bg-base-200">
                                        <tr>
                                            <th>Round</th>
                                            <th>Heat</th>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedule.map((heat, idx) => (
                                            <tr key={idx} className="hover">
                                                <td>{`${heat.division_name} - ${heat.round_name}`}</td>
                                                <td>Heat {heat.heat_num}</td>
                                                <td>{formatScheduleTime(heat.start_time)}</td>
                                                <td>{formatScheduleTime(heat.end_time)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex items-center text-base-content/70 italic p-4 bg-base-200/30 rounded-lg">
                                <InformationCircleIcon className="h-5 w-5 mr-2"/>
                                Detailed schedule is not yet available.
                            </div>
                        )}
                    </Section>                    
                    
                    {/* Live Scores by Division Section */} 
                    <Section title="Live results">
                    <p className="text-base-content/70 mb-4 text-sm">
                        Click on a division below to view live standings and results.
                    </p>
                    
                        {competitionData.map((division) => (
                            <div className='flex' key={division.division_id}>
                                <div className='border-1 border-secondary min-w-[10%] rounded text-center p-[0.5%] mb-[1%] mr-[2%]'>{division.division_name}</div>
                                <div className='flex w-[10%] gap-3'>
                                    {division.rounds.map((round) => (
                                    <div
                                     className="btn btn-outline btn-secondary w-full max-w-[100%]"
                                    key={`${division.division_id}-${round.round_id}`}>
                                        <Link href={`/events/${event.event_id}/${division.division_id}/${round.round_id}`}>                                        
                                            {round.round_name}
                                        </Link>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            ))}
                    </Section>

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
const InfoCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  value?: string; // value is now optional
  children?: React.ReactNode; // children is now an option
}> = ({ icon, title, value, children }) => (
// --- ^^^ END OF FIX ^^^ ---
    <div className="bg-base-200/40 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center mb-1.5">
            {icon}
            <h3 className="ml-2.5 text-xs font-bold uppercase text-base-content/70 tracking-wider">{title}</h3>
        </div>
        {/* If children are provided, render them. Otherwise, fall back to rendering the value prop. */}
        {children ? (
            children
        ) : (
            <p className="mt-1 text-lg text-base-content font-semibold">{value}</p>
        )}
    </div>
);

// Helper component for consistent section styling
const Section: React.FC<{ 
  title: string; 
  children: React.ReactNode;
  layout?: 'stacked' | 'inline'; // New optional prop
}> = ({ title, children, layout = 'stacked' }) => { // Default to 'stacked'
    
    if (layout === 'inline') {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
                <h2 className="text-2xl font-semibold text-secondary flex-shrink-0">
                    {title}
                </h2>
                <div className="flex-grow">
                    {children}
                </div>
            </div>
        );
    }

    // Default 'stacked' layout for other sections
    return (
        <div className="mb-8 md:mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-secondary border-b border-base-300 pb-2">
                {title}
            </h2>
            {children}
        </div>
    );
};