// app/admin/(detail)/events/[eventId]/[judgingPanel]/page.tsx
// OR app/events/[eventId]/[divisionId]/[roundId]/[roundHeatId]/[personnelId]/page.tsx
// Ensure the filename and path match the URL structure you intend.
// The error log points to app/events/[eventId]/[divisionId]/[roundId]/[roundHeatId]/[personnelId]/page.ts
// but your pasted code path is app/admin/(detail)/events/[eventId]/[judgingPanel]page.tsx.
// I'll assume the latter for now as it matches your pasted code's content better.

import React from 'react';
import { fetchJudgingPanelDataByEventId } from '@/lib/data'; // Make sure this function exists and returns expected data
import type { Metadata } from 'next';
import { notFound } from 'next/navigation'; // Import notFound
// Import your types if they are defined and used by fetchJudgingPanelDataByEventId
// For example:
// import type { JudgingPanel, EventBasicInfo } from '@/lib/definitions';

// Define the shape of the RESOLVED params object (all values are strings from URL)
interface ResolvedJudgingPanelParams {
    eventId: string;
    // If your path is truly app/admin/(detail)/events/[eventId]/[judgingPanel]page.tsx
    // then you'd have a 'judgingPanel' param here, not divisionId, roundId etc.
    // I will assume the error log was for a DIFFERENT page, and this page's params are just eventId
    // and that divisionId, roundId etc. might come from searchParams or a different logic.
    // IF THIS PAGE IS MEANT TO BE THE ONE FROM THE ERROR LOG, the params are different:
    // eventId: string;
    // divisionId: string;
    // roundId: string;
    // roundHeatId: string;
    // personnelId: string;
    judgingPanel?: string; // If this segment is actually [judgingPanel]
}

// Update prop type: params is now a Promise resolving to ResolvedJudgingPanelParams
type JudgingPanelPageProps = {
    params: Promise<ResolvedJudgingPanelParams>;
    // searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // If you use searchParams
};

// Example type for what fetchJudgingPanelDataByEventId might return
// You should define this based on your actual data structure
interface JudgingPanelData {
    name: string; // Assuming event name
    // ... other properties returned by your fetch function
}

export async function generateMetadata(
    { params: paramsPromise }: JudgingPanelPageProps
): Promise<Metadata> {
    const params = await paramsPromise; // Await the promise
    const eventIdString = params.eventId; // Access eventId after awaiting

    if (typeof eventIdString !== 'string') {
        return { title: 'Invalid Event ID | Admin | SnowScore' };
    }
    const eventId = Number(eventIdString);

    if (isNaN(eventId)) {
        return { title: 'Invalid Event ID | Admin | SnowScore' };
    }

    // Assuming fetchJudgingPanelDataByEventId returns an array and you need the first item,
    // or it returns a single object that includes the event name. Adjust as needed.
    const judgingPanels: JudgingPanelData[] | null = await fetchJudgingPanelDataByEventId(eventId); // This function needs to be defined or imported

    if (!judgingPanels || judgingPanels.length === 0) {
        return { title: 'Event Not Found - Admin | SnowScore' };
    }
    return {
        title: `Judging Panel: ${judgingPanels[0].name} | Admin | SnowScore`,
        description: `Administrative dashboard for the event: ${judgingPanels[0].name}.`,
    };
}

export default async function JudgingPanelPage(
    { params: paramsPromise }: JudgingPanelPageProps
) {
    const params = await paramsPromise; // Await the promise
    const eventIdString = params.eventId;
    // const divisionIdString = params.divisionId; // Example if these were dynamic segments
    // const roundIdString = params.roundId;
    // const roundHeatIdString = params.roundHeatId;
    // const personnelIdString = params.personnelId;

    if (typeof eventIdString !== 'string' ) { // Add checks for other IDs if they are dynamic segments
        console.error("JudgingPanelPage: Invalid route parameters received", params);
        notFound();
    }

    const event_id = Number(eventIdString);
    // const division_id = Number(divisionIdString);
    // const round_id = Number(roundIdString);
    // const round_heat_id = Number(roundHeatIdString);
    // const personnel_id = Number(personnelIdString);

    if (isNaN(event_id)) { // Add isNaN checks for other parsed IDs
        console.error("JudgingPanelPage: One or more ID parameters are NaN", { eventIdString });
        notFound();
    }

    // Fetch data based on the IDs.
    // The name fetchJudgingPanelDataByEventId implies it might take more than just event_id
    // if it's for a very specific panel.
    // For now, assuming it only takes event_id and returns relevant data.
    const judgingPanelData = await fetchJudgingPanelDataByEventId(event_id); // This needs to be defined and return useful data.

    if (!judgingPanelData || (Array.isArray(judgingPanelData) && judgingPanelData.length === 0)) {
        console.warn(`JudgingPanelPage: No data found for event_id ${event_id}`);
        notFound();
    }

    // For display, assuming judgingPanelData is an array and we take the first event's name
    // Or, if it's a single object with event details.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const displayName = Array.isArray(judgingPanelData) ? judgingPanelData[0]?.name : (judgingPanelData as any)?.name || "Event";


    return (
      <div className='ml-10 p-6'> {/* Added padding */}
        <h1 className='text-2xl font-bold mt-10 mb-5'>Judging Panel Details for: {displayName}</h1>
        <p className="mb-4">This page will display and allow management of judges for a specific event, division, round, or heat based on the URL parameters.</p>
        <div className="text-xl bg-base-200 p-4 rounded-md shadow">
          <h2 className="text-lg font-semibold mb-2">Route Parameters Received:</h2>
          <p>Event ID: {event_id}</p>
          {/* Conditionally display other IDs if they were part of the route and parsed */}
          {/* <p>Division ID: {division_id}</p> */}
          {/* <p>Round ID: {round_id}</p> */}
          {/* <p>Heat ID (RoundHeatID): {round_heat_id}</p> */}
          {/* <p>Personnel ID: {personnel_id}</p> */}
          <pre className="mt-4 text-xs bg-neutral text-neutral-content p-2 rounded">
            Raw Params: {JSON.stringify(params, null, 2)}
          </pre>
        </div>

        {/*
          Here you would map over `judgingPanelData` (if it's an array of judges for this context)
          or use specific fields from it to build your UI for managing judges.
          Example:
          {Array.isArray(judgingPanelData) && judgingPanelData.map(panel => (
              <div key={panel.someUniqueId}>
                  Judge: {panel.judgeName}, Role: {panel.role}
                  // Add edit/delete buttons calling server actions
              </div>
          ))}
        */}
      </div>
  );
}