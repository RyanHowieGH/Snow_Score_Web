// app\admin\(detail)\events\[eventId]\page.tsx

import React from "react";
import Link from "next/link";
import { fetchEventById } from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/utils";
import type { EventDetails } from "@/lib/definitions";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUserWithRole } from "@/lib/auth/user";
import type { AppUserWithRole } from "@/lib/auth/user";
import type { Metadata } from "next";
import EditHeadJudgeButton from "@/components/EditHeadJudgesButton";

// Note: AdminHeader should be in app/admin/layout.tsx, not directly here.
// If you need to pass eventName to it, that's a more advanced layout composition.
// For now, this page assumes AdminHeader is rendered by the layout.

import {
  UsersIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
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
  const allowedRoles = [
    "Executive Director",
    "Administrator",
    "Chief of Competition",
  ];
  if (!user || !allowedRoles.includes(user.roleName)) {
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

  return (
    // VVV --- REDUCED TOP PADDING for less headroom --- VVV
    <div className="space-y-6 p-4 md:pt-2 md:px-6 md:pb-6">
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
          <h2 className="card-title text-xl text-secondary mb-4">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p>
              <strong className="font-medium text-base-content/70 block mb-0.5">
                Location:
              </strong>{" "}
              {event.location}
            </p>
            <p>
              <strong className="font-medium text-base-content/70 block mb-0.5">
                Dates:
              </strong>{" "}
              {formatDateRange(startDate, endDate)}
            </p>
            <p>
              <strong className="font-medium text-base-content/70 block mb-0.5">
                Status:
              </strong>
              <span
                className={`ml-1 badge badge-sm ${
                  event.status?.toLowerCase() === "scheduled"
                    ? "badge-success"
                    : event.status?.toLowerCase() === "completed"
                    ? "badge-primary"
                    : event.status?.toLowerCase() === "cancelled"
                    ? "badge-error"
                    : "badge-ghost"
                } badge-outline`}
              >
                {event.status || "N/A"}
              </span>
            </p>
            <p>
              <strong className="font-medium text-base-content/70">
                Discipline:
              </strong>{" "}
              {event.discipline_name || "Not Specified"}
            </p>
            <p>
              <strong className="font-medium text-base-content/70">
                Divisions:
              </strong>{" "}
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
                : "None"}
            </p>
            <p>
              <strong className="font-medium text-base-content/70">
                Registered Athletes:
              </strong>{" "}
              {event.athletes?.length || 0}
            </p>
            <p>
              <strong className="font-medium text-base-content/70">
                Assigned Judges:
              </strong>{" "}
              {event.judges?.length || 0}
            </p>
            <div className="flex items-center gap-2">
              <strong className="font-medium text-base-content/70">
                Head Judge:
              </strong>
              {event.headJudge && event.headJudge.length > 0
                ? event.headJudge
                    .map((hj) => `${hj.first_name} ${hj.last_name}`)
                    .join(", ")
                : "None"}
              <EditHeadJudgeButton eventId={eventId} userRoleId={user.roleId} />
            </div>
          </div>
        </div>
      </div>

      {/* Management Actions Grid - "Management Sections" header removed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pt-2">
        {" "}
        {/* Removed margin-top that was for the header */}
        <ManagementActionCard
          title="Manage Schedule"
          description="Set and adjust start and end times for all heats in the event."
          linkHref={`/admin/events/${eventId}/manage-schedule`}
          icon={<ClockIcon className="h-7 w-7 text-info" />}
        />
        <ManagementActionCard
          title="Event Setup"
          description="Modify core details, dates, location, discipline, status, and assigned divisions."
          linkHref={`/admin/events/${eventId}/edit-details`}
          icon={<WrenchScrewdriverIcon className="h-7 w-7 text-primary" />} // Slightly smaller icon
        />
        <ManagementActionCard
          title="Athlete Roster"
          description="Register, view, and manage athlete participation and bib numbers."
          linkHref={`/admin/events/${eventId}/manage-athletes`}
          icon={<UsersIcon className="h-7 w-7 text-secondary" />} // Slightly smaller icon
        />
        <ManagementActionCard
          title="Judges & Officials"
          description="Assign and manage judges and other event personnel."
          linkHref={`/admin/events/${eventId}/manage-judges`}
          icon={<UserGroupIcon className="h-7 w-7 text-accent" />} // Slightly smaller icon
        />
      </div>

      {/* Optional: Publish button */}
      {event.status?.toLowerCase() === "draft" && (
        <div className="mt-8 pt-6 border-t border-base-300 text-center">
          <button className="btn btn-success btn-lg">Publish Event</button>
          <p className="text-xs text-base-content/60 mt-2">
            Make this event visible to the public and open for registrations (if
            applicable).
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
        <h2 className="card-title text-lg font-bold mb-1 md:mb-0">
          {title}
        </h2>{" "}
        {/* Reduced margin */}
        <p className="text-xs text-base-content/80 flex-grow mb-0">
          {description}
        </p>{" "}
        {/* Reduced text size & margin */}
        <div className="card-actions justify-center w-full mt-auto pt-0">
          {" "}
          {/* Reduced padding-top */}
          <span className="btn btn-xs btn-outline btn-primary w-full md:w-auto">
            {" "}
            {/* Smaller button */}
            Go to {title.split(" ")[0]}
          </span>
        </div>
      </div>
    </div>
  </Link>
);
