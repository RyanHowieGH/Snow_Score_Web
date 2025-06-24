import React from 'react';
import Link from 'next/link';
import { fetchEventById } from '@/lib/data';
import { formatDate, formatDateRange } from '@/lib/utils';
import type { EventDetails } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import type { AppUserWithRole } from '@/lib/auth/user';
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

// Define the shape of the resolved params object
interface ResolvedPublicEventParams {
    eventId: string;
}

// VVV --- THIS IS THE KEY CHANGE FOR THE TYPE ERROR --- VVV
type PublicEventDetailPageProps = {
    params: Promise<ResolvedPublicEventParams>; // params is a Promise
    // searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // If you use searchParams
};
// ^^^ --- THIS IS THE KEY CHANGE FOR THE TYPE ERROR --- ^^^

export async function generateMetadata(
    { params: paramsPromise }: PublicEventDetailPageProps // Renamed prop for clarity
): Promise<Metadata> {
    const params = await paramsPromise; // Await the promise
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) {
        return { title: 'Event Not Found | SnowScore' };
    }

    const event = await fetchEventById(eventId);

    if (!event) {
        return { title: 'Event Not Found | SnowScore' };
    }

    const startDateForDesc = event.start_date instanceof Date ? event.start_date : new Date(event.start_date);
    const endDateForDesc = event.end_date instanceof Date ? event.end_date : new Date(event.end_date);
    const formattedStartDate = formatDate(startDateForDesc);
    const formattedEndDate = formatDate(endDateForDesc);

    return {
        title: `${event.name} | Event Details | SnowScore`,
        description: `View details for the event: ${event.name}, taking place at ${event.location} from ${formattedStartDate} to ${formattedEndDate}.`,
        openGraph: {
            title: `${event.name} | SnowScore Event`,
            description: `Join or view details for ${event.name}, located at ${event.location}.`,
            type: 'article',
        },
    };
}

export default async function PublicEventDetailPage(
    { params: paramsPromise }: PublicEventDetailPageProps // Renamed prop for clarity
) {
    const params = await paramsPromise; // Await the promise
    const eventId = Number(params.eventId);

    if (isNaN(eventId)) {
        console.warn(`PublicEventDetailPage: Invalid eventId param received: ${params.eventId}`);
        notFound();
    }

    const event: EventDetails | null = await fetchEventById(eventId);

    if (!event) {
        console.warn(`PublicEventDetailPage: Event not found in database for ID: ${eventId}`);
        notFound();
    }

    const authResult = await auth();
    const clerkUserId = authResult.userId;
    let isAdmin = false;
    if (clerkUserId) {
        const appUser: AppUserWithRole | null = await getAuthenticatedUserWithRole();
        if (appUser) {
            const adminRoles = ['admin', 'Executive Director', 'Administrator', 'Chief of Competition'];
            isAdmin = adminRoles.includes(appUser.roleName);
        }
    }

    const startDate = event.start_date instanceof Date ? event.start_date : new Date(event.start_date);
    const endDate = event.end_date instanceof Date ? event.end_date : new Date(event.end_date);

    return (
        <main className="bg-base-200 min-h-screen">
            <BlankHeader />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="bg-base-100 p-6 md:p-10 rounded-2xl shadow-xl">
                    <div className="border-b border-base-300 pb-6 mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-grow">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight leading-tight">
                                    {event.name}
                                </h1>
                                <p className="mt-2 text-lg sm:text-xl text-base-content opacity-80 flex items-center">
                                    <MapPinIcon className="h-5 w-5 mr-2 opacity-70" />
                                    {event.location}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 sm:mt-0 self-start sm:self-auto">
                                <Link
                                    href="/"
                                    className="btn btn-outline btn-sm whitespace-nowrap"
                                    title="Return to events list"
                                >
                                    <ArrowUturnLeftIcon className="h-4 w-4 mr-1.5" />
                                    All Events
                                </Link>
                                {isAdmin && (
                                    <a
                                        href={`/admin/events/${eventId}`}
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
                </div>
            </div>
        </main>
    );
}

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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8 md:mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-secondary border-b border-base-300 pb-2">
            {title}
        </h2>
        {children}
    </div>
);