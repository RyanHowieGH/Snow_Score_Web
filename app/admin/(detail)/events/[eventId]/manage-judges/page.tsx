import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import ManageJudgingPanelsDisplay from '../../../../../../components/ManageJudgesSection'
import type { Metadata } from 'next'
import { fetchJudgingPanelDataByEventId, fetchEventById } from '@/lib/data'
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'
import JudgeEventSepecificSection from "components/JudgeEventSpecificSection"
import type { JudgingPanelPerEvent } from '@/lib/definitions'
import { Toaster } from 'react-hot-toast'
    
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const eventIdString = params?.eventId;
    if (typeof eventIdString !== 'string') return { title: 'Invalid Event ID Type' };
    const eventId = parseInt(eventIdString, 10);
    if (isNaN(eventId)) return { title: 'Invalid Event' };
        const eventDetails = await fetchEventById(eventId);
    return {
        title: eventDetails ? `Manage Judges: ${eventDetails.name}` : 'Manage Event Judges',
        };
}

export default async function ManageJudgingPanelsPage({ params }: { params: { eventId: string } }) {
    const eventIdString = params.eventId;
    const eventId = parseInt(eventIdString, 10);
    if (isNaN(eventId)) {
        notFound();
    }
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition', 'Head Judge'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin');
    }
    const eventDetails = await fetchEventById(eventId);
    if (!eventDetails) {
        notFound();
    }

    const panels: JudgingPanelPerEvent[] | null = await fetchJudgingPanelDataByEventId(Number(eventId));

    return (
        <div className="space-y-6">
            <Toaster />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl md:text-3xl font-bold">Manage Judges:{` `}
                    <span className='font-normal'>
                        {eventDetails.name}
                    </span>
                </h2>
                <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                    Back to Event Dashboard
                </Link>
            </div>

            <div className="card bg-base-100 shadow-md">
                <JudgeEventSepecificSection
                    judges={eventDetails.judges} 
                    event_id={eventId}/>
                <div className="card-body">
                    <ManageJudgingPanelsDisplay 
                        panels={panels}
                        event_id = {eventId} />
                </div>
            </div>
        </div>
    );
}
