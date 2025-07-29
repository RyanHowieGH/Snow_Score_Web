// app\admin\(detail)\events\[eventId]\page.tsx

export const dynamic = 'force-dynamic';

import React from "react";
import Link from "next/link";
import { fetchEventById } from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/utils";
import { getEventState } from "@/lib/utils"; 
import type { EventDetails } from "@/lib/definitions";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUserWithRole } from "@/lib/auth/user";
import type { AppUserWithRole } from "@/lib/auth/user";
import type { Metadata } from "next";
import EditHeadJudgeButton from "@/components/EditHeadJudgesButton";
import PublishEventButton from '@/components/PublishEventButton';
import { ArticleGenerator } from './ArticleGenerator'; // <-- Add this import
import { Toaster } from 'react-hot-toast';
import QuickviewHeadjudgeDisplay from "@/components/QuickviewHeadjudgeDisplay";

// Note: AdminHeader should be in app/admin/layout.tsx, not directly here.
// If you need to pass eventName to it, that's a more advanced layout composition.
// For now, this page assumes AdminHeader is rendered by the layout.

import {
  UsersIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

type AdminEventDetailPageProps = {
  params: { eventId: string };
};

export async function generateMetadata({
  params: paramsProp,
}: AdminEventDetailPageProps): Promise<Metadata> {
  const params = await paramsProp;
  const eventId = Number(params.eventId);

  if (isNaN(eventId)) return { title: "Event Not Found - Admin | SnowScore" };

  const event = await fetchEventById(eventId);
  if (!event) return { title: "Event Not Found - Admin | SnowScore" };

  return {
    title: `Manage: ${event.name} | Admin | SnowScore`,
    description: `Administrative dashboard for the event: ${event.name}.`,
  };
}

export default async function AdminEventDetailPage({
  params: paramsProp,
}: AdminEventDetailPageProps) {
  const params = await paramsProp;
  const eventId = Number(params.eventId);

  const user = await getAuthenticatedUserWithRole();
  const allowedRolesToView = [
    "Executive Director",
    "Administrator",
    "Chief of Competition",
    "Head Judge",
  ];

   const allowedRolesToManageTheEvent = [
    "Executive Director",
    "Administrator",
    "Chief of Competition",
  ];

 
  if (!user || !allowedRolesToView.includes(user.roleName)) {
    console.warn(
      `Unauthorized access attempt to /admin/events/${eventId} by user: ${user?.email} with role: ${user?.roleName}`
    );
    redirect("/admin?error=unauthorized_event_access");
  }

  if (isNaN(eventId)) {
    notFound();
  }

  const event: EventDetails | null = await fetchEventById(eventId);

  if (!event) {
    notFound();
  }

  const startDate =
    event.start_date instanceof Date
      ? event.start_date
      : new Date(event.start_date);
  const endDate =
    event.end_date instanceof Date ? event.end_date : new Date(event.end_date);
    const eventState = getEventState(startDate, endDate);

  const disciplineDisplay = [event.category_name, event.subcategory_name]
    .filter(Boolean) // Removes any null or undefined values
    .join(' - '); // Joins the parts with a space, e.g., "Freestyle Big Air"

  return (
    // VVV --- REDUCED TOP PADDING for less headroom --- VVV
    <div className="space-y-6 p-4 md:pt-2 md:px-6 md:pb-6">
      <Toaster />
      {/* Page Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-base-300">
        {" "}
        {/* Reduced pb */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-base-content leading-tight">
            {event.name}
          </h1>
          <p className="text-lg text-base-content/80 mt-1">
            Event Management Dashboard
          </p>
        </div>
        <Link
          href="/admin/events"
          className="btn btn-sm btn-outline self-start sm:self-center whitespace-nowrap"
        >
          Back to Events List
        </Link>
      </div>

      {/* Core Event Info Display */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="
           card-title 
           text-xl 
           text-secondary 
           mb-4
           s256:text-xs
           s384:text-sm
           s576:text-lg
           md:text-lg
           lg:text-xl
           xl:text-2xl
           2xl:text-3xl
           3xl:text-4xl">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm
           s256:text-xs
           s384:text-sm
           s576:text-base
           md:text-lg
           lg:text-xl">
            <p className="font-medium text-base-content/70 block">
                Location:{" "}
                <span className="font-normal">{event.location}</span>
            </p>
            <p className="font-medium text-base-content/70 block mb-0.5">
                Dates:{" "}
                <span className="font-normal">
                  {formatDateRange(startDate, endDate)}
                </span>
            </p>
            <p className="font-medium text-base-content/70 block mb-0.5">
                Status:{' '}
              <span
                className={`ml-1 badge badge-sm ${
                  eventState === "ONGOING"
                    ? "badge-success" // Green for live/ongoing
                    : eventState === "COMPLETE"
                    ? "badge-primary" // Blue/Primary for completed
                    : "badge-ghost"   // Default/Ghost for upcoming
                } badge-outline`}
              >
                {eventState}
              </span>
            </p>
            <p className="font-medium text-base-content/70">
                Discipline:{" "}
                <span className="font-normal">
                  {disciplineDisplay || "Not Specified"}
                </span>
            </p>
            <p className="font-medium text-base-content/70">
                Divisions:{" "}
                <span className="font-normal">
                  {event.divisions?.length
                  ? event.divisions
                      .map((division) => {
                        const count = event.athletes?.filter(
                          (athlete) =>
                            athlete.division_id === division.division_id
                        ).length;
                        return `${division.division_name} (${count})`;
                      })
                      .join(", ")
                  : 0}
                </span>
              
            </p>
            <p className="font-medium text-base-content/70">
                Registered Athletes:{" "}
                <span className="font-normal">
                  {event.athletes?.length || 0}
                </span>
              
            </p>
            <p className="font-medium text-base-content/70">
                Assigned Judges:{" "}
                <span className="font-normal">
                  {event.judges?.length || 0}
                </span>
            </p>
            {(!user || !allowedRolesToView.includes(user.roleName)) ? 
              <QuickviewHeadjudgeDisplay eventId = {eventId} userRoleId={user.roleId} event={event} permissionToEdit={false} />
              :
              <QuickviewHeadjudgeDisplay eventId = {eventId} userRoleId={user.roleId} event={event} permissionToEdit={true}/>
              }
          </div>
        </div>
      </div>

      {/* Management Actions Grid - "Management Sections" header removed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pt-2">
        {" "}
        {/* Removed margin-top that was for the header */}
        {allowedRolesToManageTheEvent.includes(user.roleName) && (
          <ManagementActionCard
          title="Manage Schedule"
          description="Set and adjust start and end times for all heats in the event."
          linkHref={`/admin/events/${eventId}/manage-schedule`}
          icon={<ClockIcon className="h-7 w-7 text-info" />}
        />
        )}

        {allowedRolesToManageTheEvent.includes(user.roleName) && (
        <ManagementActionCard
          title="Event Setup"
          description="Modify core details, dates, location, discipline, status, and assigned divisions."
          linkHref={`/admin/events/${eventId}/edit-details`}
          icon={<WrenchScrewdriverIcon className="h-7 w-7 text-primary" />} // Slightly smaller icon
        />
        )}

        {allowedRolesToManageTheEvent.includes(user.roleName) && (
        <ManagementActionCard
          title="Rounds and Heats"
          description="Add, edit and manage rounds and heats."
          linkHref={`/admin/events/${eventId}/manage-rounds-heats`}
          icon={<TableCellsIcon className="h-7 w-7" />} // Slightly smaller icon
        />)}

        {allowedRolesToManageTheEvent.includes(user.roleName) && (
        <ManagementActionCard
          title="Athlete Roster"
          description="Register, view, and manage athlete participation and bib numbers."
          linkHref={`/admin/events/${eventId}/manage-athletes`}
          icon={<UsersIcon className="h-7 w-7 text-secondary" />} // Slightly smaller icon
        />)}

        {(allowedRolesToManageTheEvent.includes(user.roleName) ||
        allowedRolesToView.includes(user.roleName)) && (
        <ManagementActionCard
          title="Judges & Officials"
          description="Assign and manage judges and other event personnel."
          linkHref={`/admin/events/${eventId}/manage-judges`}
          icon={<UserGroupIcon className="h-7 w-7 text-accent" />} // Slightly smaller icon
        />
        )}
        {allowedRolesToManageTheEvent.includes(user.roleName) && (
          <ArticleGenerator eventId={eventId} />
        )}

      </div>

      {/* Optional: Publish button */}
      {(event.status?.toLowerCase() === "draft" &&
      allowedRolesToManageTheEvent.includes(user.roleName)) && (
        <div className="mt-8 pt-6 border-t border-base-300 text-center">
    <PublishEventButton eventId={eventId} />
    <p className="text-xs text-base-content/60 mt-2">
        Make this event visible to the public and open for registrations (if applicable).
    </p>
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
  isExternal?: boolean;
}

const ManagementActionCard: React.FC<ManagementActionCardProps> = ({
  title,
  description,
  linkHref,
  icon,
  isExternal,
}) => (
  <Link
    href={linkHref}
    target={isExternal ? "_blank" : "_self"}
    rel={isExternal ? "noopener noreferrer" : undefined}
    className="block hover:no-underline group" // Added group for potential group-hover effects
  >
    {/* VVV --- REDUCED CARD PADDING AND MIN-HEIGHT for less tall cards --- VVV */}
    <div className="card bg-base-100 shadow-lg group-hover:shadow-2xl group-hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 h-full flex flex-col min-h-[150px] sm:min-h-[150px]">
      {" "}
      {/* min-height can be adjusted or removed */}
      <div className="card-body flex flex-col items-center text-center p-4 md:p-5">
        {" "}
        {/* Reduced padding */}
        <div className="p-2 bg-primary/10 rounded-full mb-2 md:mb-3">
          {icon}
        </div>{" "}
        {/* Reduced margin */}
        <h2 className="card-title text-lg font-bold mb-1 md:mb-0
         s256:text-xs
         s384:text-sm
         s576:text-base
         md:text-lg
         lg:text-xl
         xl:text-2xl">
          {title}
        </h2>{" "}
        {/* Reduced margin */}
        <p className="text-xs 
         text-base-content/80 
         flex-grow 
         mb-0
         md:text-sm
         md:mb-2">
          {description}
        </p>{" "}
        {/* Reduced text size & margin */}
        <div className="card-actions justify-center w-full mt-auto pt-0">
          {" "}
          {/* Reduced padding-top */}
          <span className="
           btn 
           btn-xs 
           md:btn-sm 
           btn-outline 
           btn-primary 
           w-full 
           md:w-auto
           s256:btn-xs
           s384:btn-xs
           s576:btn-xs
           ">
            {" "}
            {/* Smaller button */}
            Go to {title.split(" ")[0]}
          </span>
        </div>
      </div>
    </div>
  </Link>
);
