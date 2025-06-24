// app/admin/(detail)/events/[eventId]/manage-judges/page.tsx
import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import JudgeEventSpecificSection from "components/JudgeEventSpecificSection"; // Your component
import type { Metadata } from 'next';
import { fetchEventById } from '@/lib/data';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
// Import necessary types from your definitions file
import type { EventDetails } from '@/lib/definitions';

// Define the shape of the resolved params object
interface ResolvedPageParams {
    eventId: string;
}

// VVV --- THIS IS THE KEY CHANGE FOR THE TYPE ERROR --- VVV
interface ManageJudgesPageProps {
    params: Promise<ResolvedPageParams>; // params is a Promise that resolves to an object with eventId
    // searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // If you use searchParams
}
// ^^^ --- THIS IS THE KEY CHANGE FOR THE TYPE ERROR --- ^^^

export async function generateMetadata(
    { params: paramsPromise }: ManageJudgesPageProps // Renamed prop for clarity
): Promise<Metadata> {
    const params = await paramsPromise; // <<< --- AWAIT THE PROMISE --- <<<
    const eventIdString = params?.eventId; // Access eventId after awaiting

    if (typeof eventIdString !== 'string') {
        return { title: 'Invalid Event ID Format | Manage Judges | SnowScore Admin' };
    }
    const eventId = parseInt(eventIdString, 10);
    if (isNaN(eventId)) {
        return { title: 'Invalid Event ID | Manage Judges | SnowScore Admin' };
    }

    const eventDetails: EventDetails | null = await fetchEventById(eventId);
    return {
        title: eventDetails ? `Manage Judges: ${eventDetails.name} | SnowScore Admin` : 'Manage Event Judges | SnowScore Admin',
    };
}

export default async function ManageJudgingPanelsPage(
    { params: paramsPromise }: ManageJudgesPageProps // Renamed prop for clarity
) {
    const params = await paramsPromise; // <<< --- AWAIT THE PROMISE --- <<<
    const eventIdString = params.eventId; // Access eventId after awaiting
    const eventId = parseInt(eventIdString, 10);

    if (isNaN(eventId)) {
        console.error("ManageJudgingPanelsPage: eventId is NaN from params", params);
        notFound();
    }

    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin?error=unauthorized_judge_management');
    }

    const eventDetails: EventDetails | null = await fetchEventById(eventId);
    if (!eventDetails) {
        console.error(`ManageJudgingPanelsPage: Event details not found for eventId ${eventId}`);
        notFound();
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-base-300">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Manage Judges</h1>
                    <p className="text-lg text-base-content/80">For Event: {eventDetails.name}</p>
                </div>
                <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                    Back to Event Dashboard
                </Link>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    {/*
                        Ensure JudgeEventSpecificSection is correctly imported,
                        is a Client Component ('use client';) if it has interactivity,
                        and accepts the props being passed.
                    */}
                    <JudgeEventSpecificSection
                        judges={eventDetails.judges} // Pass the judges array from eventDetails
                        event_id={eventId}             // Pass eventId (as number)
                    />
                    {/*
                    If ManageJudgingPanelsDisplay is your main component:
                    <ManageJudgingPanelsDisplay eventId={String(eventId)} />
                    */}
                </div>
            </div>
        </div>
    );
}