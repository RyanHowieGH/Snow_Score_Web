// app/admin/(detail)/events/[eventId]/page.tsx
import React from 'react';
import Link from 'next/link';
import { fetchEventById } from '@/lib/data';
import { formatDate, formatDateRange } from '@/lib/utils';
import type { EventDetails } from '@/lib/definitions';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your auth helper
import type { AppUserWithRole } from '@/lib/auth/user';
import type { Metadata } from 'next';
// Note: AdminHeader should be in app/admin/layout.tsx, not directly here.
// If you need to pass eventName to it, that's a more advanced layout composition.
// For now, this page assumes AdminHeader is rendered by the layout.

import {
    UsersIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    MapPinIcon,
    TrophyIcon,
    WrenchScrewdriverIcon,
    ListBulletIcon,
    ClipboardDocumentListIcon,
    TicketIcon
} from '@heroicons/react/24/outline';

type AdminEventDetailPageProps = {
    params: { eventId: string };
};

export async function generateMetadata({ params }: AdminEventDetailPageProps): Promise<Metadata> {
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) return { title: 'Event Not Found - Admin | SnowScore' };

    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Event Not Found - Admin | SnowScore' };

    return {
        title: `Manage: ${event.name} | Admin | SnowScore`,
        description: `Administrative dashboard for the event: ${event.name}.`,
    };
}

export default async function AdminEventDetailPage({ params }: AdminEventDetailPageProps) {
    const eventId = Number(params.eventId);

    // Authorization Check (Middleware should primarily handle this for /admin routes)
    // This is defense-in-depth or for more granular role checks if needed.
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition']; // Roles that can manage events
    if (!user || !allowedRoles.includes(user.roleName)) {
        console.warn(`Unauthorized access attempt to /admin/events/${eventId} by user: ${user?.email} with role: ${user?.roleName}`);
        // Redirect to admin dashboard or a generic unauthorized page if middleware didn't catch it
        redirect('/admin?error=unauthorized_event_access');
    }

    if (isNaN(eventId)) {
        notFound();
    }

    const event: EventDetails | null = await fetchEventById(eventId);

    if (!event) {
        notFound();
    }

    const startDate = event.start_date instanceof Date ? event.start_date : new Date(event.start_date);
    const endDate = event.end_date instanceof Date ? event.end_date : new Date(event.end_date);

    return (
        <div className="space-y-8"> {/* Provides spacing between sections */}
            {/* Page Header Section (within the content area of admin layout) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-base-300">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-base-content leading-tight">
                        {event.name}
                    </h1>
                    <p className="text-lg text-base-content/80 mt-1">Event Management Dashboard</p>
                </div>
                <Link href="/admin/events" className="btn btn-sm btn-outline self-start sm:self-center">
                    Back to Events List
                </Link>
            </div>

            {/* Core Event Info Display */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-xl text-secondary mb-4">Quick Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong className="font-medium text-base-content/70">Location:</strong> {event.location}</p>
                        <p><strong className="font-medium text-base-content/70">Dates:</strong> {formatDateRange(startDate, endDate)}</p>
                        <p><strong className="font-medium text-base-content/70">Status:</strong>
                            <span className={`ml-1 badge badge-sm ${
                                event.status?.toLowerCase() === 'scheduled' ? 'badge-success' :
                                event.status?.toLowerCase() === 'completed' ? 'badge-primary' :
                                event.status?.toLowerCase() === 'cancelled' ? 'badge-error' : 'badge-ghost'
                            } badge-outline`}>
                                {event.status || 'N/A'}
                            </span>
                        </p>
                        <p><strong className="font-medium text-base-content/70">Discipline:</strong> {event.discipline_name || 'Not Specified'}</p>
                        <p><strong className="font-medium text-base-content/70">Divisions:</strong> {event.divisions?.map(d => d.division_name).join(', ') || 'None'}</p>
                        <p><strong className="font-medium text-base-content/70">Registered Athletes:</strong> {event.athletes?.length || 0}</p>
                        <p><strong className="font-medium text-base-content/70">Assigned Judges:</strong> {event.judges?.length || 0}</p>
                        {event.headJudge && event.headJudge.length > 0 && (
                             <p><strong className="font-medium text-base-content/70">Head Judge:</strong> {event.headJudge.map(hj => `${hj.first_name} ${hj.last_name}`).join(', ')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Management Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ManagementActionCard
                    title="Edit Event Details"
                    description="Modify core information like name, dates, location, and status."
                    linkHref={`/admin/events/${eventId}/edit-details`}
                    icon={<WrenchScrewdriverIcon className="h-8 w-8 text-primary" />}
                />
                <ManagementActionCard
                    title="Manage Athletes"
                    description="Register, view, and manage athlete participation and bib numbers."
                    linkHref={`/admin/events/${eventId}/manage-athletes`}
                    icon={<UsersIcon className="h-8 w-8 text-secondary" />}
                />
                <ManagementActionCard
                    title="Manage Judges"
                    description="Assign and manage judges for the event."
                    linkHref={`/admin/events/${eventId}/manage-judges`} // Assuming this path
                    icon={<UserGroupIcon className="h-8 w-8 text-accent" />}
                />
                {/* Add more management cards as needed */}
                {/* Example:
                <ManagementActionCard
                    title="View Schedule"
                    description="Review and manage the event schedule."
                    linkHref={`/admin/events/${eventId}/schedule`}
                    icon={<CalendarDaysIcon className="h-8 w-8 text-info" />}
                />
                <ManagementActionCard
                    title="Scores & Results"
                    description="Input scores and publish official results."
                    linkHref={`/admin/events/${eventId}/results`}
                    icon={<ClipboardDocumentListIcon className="h-8 w-8 text-success" />}
                />
                <ManagementActionCard
                    title="Public View"
                    description="See how this event appears to the public."
                    linkHref={`/events/${eventId}`} // Link to the public page
                    icon={<TicketIcon className="h-8 w-8 text-warning" />}
                    isExternal // (or a prop to indicate it's not an admin sub-page, for styling/target)
                />
                */}
            </div>

            {/* Optional: Publish button if event is in Draft status */}
            {event.status?.toLowerCase() === 'draft' && (
                <div className="mt-8 text-center">
                    {/* This button would likely trigger a Server Action */}
                    <button className="btn btn-success btn-wide">
                        Publish Event
                    </button>
                </div>
            )}
        </div>
    );
}

// Helper component for the action cards
interface ManagementActionCardProps {
    title: string;
    description: string;
    linkHref: string;
    icon: React.ReactNode;
    isExternal?: boolean; // Optional: to open in new tab or style differently
}

const ManagementActionCard: React.FC<ManagementActionCardProps> = ({ title, description, linkHref, icon, isExternal }) => (
    <Link href={linkHref} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : ""}>
        <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow h-full"> {/* Ensure cards are same height if needed */}
            <div className="card-body items-center text-center md:items-start md:text-left"> {/* Responsive alignment */}
                <div className="mb-3">{icon}</div>
                <h2 className="card-title text-lg font-semibold">{title}</h2>
                <p className="text-sm text-base-content/80">{description}</p>
                <div className="card-actions justify-end mt-auto pt-3 w-full"> {/* Push button to bottom */}
                    <span className="btn btn-sm btn-outline btn-primary w-full md:w-auto">
                        Go to {title.split(' ')[0]} {/* e.g., "Go to Edit" */}
                    </span>
                </div>
            </div>
        </div>
    </Link>
);