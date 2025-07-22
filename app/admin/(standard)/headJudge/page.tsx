import React, { use } from 'react';
import { getAuthenticatedUserWithRole } from "@/lib/auth/user";
import { notFound } from 'next/navigation';
import EventList from '@/components/EventList'; // Ensure correct path
import { fetchEventsFilteredByRoleId } from '@/lib/data';
import type { SnowEvent } from '@/lib/definitions';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage Events - Admin Panel | SnowScore',
};

export default async function HeadJudge () {

  const user = await getAuthenticatedUserWithRole();
  
  const administrativeRoles = [
    "Executive Director",
    "Administrator",
    "Chief of Competition",
  ];

  const headJudgeRole = [
    "Head Judge",
  ]

    const events: SnowEvent[] = user?.roleId !== undefined
      ? await fetchEventsFilteredByRoleId(user.appUserId)
      : [];

    return(
        <div>
            { !user ? (

              //Public user
                notFound()

            ) : administrativeRoles.includes(user.roleName) ? (
              
              // Administrator view
                <div>ADMN here.</div>
            
            ) : headJudgeRole.includes(user.roleName) ? (

              // Head Judge view
                <div>
                  <div className="min-h-screen bg-base-300">
                      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                              <h2 className="text-2xl md:text-3xl font-bold text-base-content">Events Dashboard</h2>
                          </div>
                          {events.length === 0 && (
                            <div className='mb-10 text-xl font-semibold'>You have not yet been assigned as a Head Judge to any event.</div>
                          )}
                          {events.length > 0 && (
                            <div>
                              <div className='mb-10 text-xl font-semibold'>You have been assigned as the Head Judge for the following events:</div>
                              <EventList
                                  events={events}
                                  title="" // Title is handled above
                                  showCreateButton={false} // Create button handled above
                                  baseUrl="/admin/events"   // <<< CRUCIAL: Links will be /admin/events/[id]
                                  linkActionText="Manage" // <<< CRUCIAL: Button text
                                  // linkActionSuffix="/edit-details" // Optional: if you want to go directly to edit
                                  noEventsMessage="No events found. Click 'Create New Event' to get started."
                                  className="space-y-6"
                                  itemGridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // Or your preferred admin list layout
                                  titleTextColor="text-base-content" // Or specific admin theme color
                                  isAdminView={true} // <<< CRUCIAL: Indicates this is an admin view
                              />
                            </div>
                          )}
                      </div>
                  </div>
                </div>
            ) : (

              // Internal user who is not Administrator nor Head Judge
                <div>You do not have the required permissions to access this page content.</div>
            )}
        </div>
    )
}