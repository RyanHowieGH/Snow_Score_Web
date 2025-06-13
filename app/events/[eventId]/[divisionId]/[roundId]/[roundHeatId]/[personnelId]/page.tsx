// app/admin/(detail)/events/[eventId]/[judgingPanel]page.tsx
import React from 'react';
import Link from 'next/link';
import { fetchJudgingPanelDataByEventId } from '@/lib/data';
import { formatDate, formatDateRange } from '@/lib/utils';
import type { EventDetails } from '@/lib/definitions';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your auth helper
import type { AppUserWithRole } from '@/lib/auth/user';
import type { Metadata } from 'next';
// Note: AdminHeader should be in app/admin/layout.tsx, not directly here.
// If you need to pass eventName to it, that's a more advanced layout composition.
// For now, this page assumes AdminHeader is rendered by the layout.


type JudgingPanelPageProps = {
  params:{
    eventId: number;    
    roundId: number;
    divisionId: number;
    roundHeatId: number;
    personnelId: number
  };
};

type AthleteRun = {
  athlete_id: number;
  bib: number;
  round_heat_id: number;
  runs: number[];
};

export async function generateMetadata({params} : JudgingPanelPageProps ): Promise<Metadata> {
  const { eventId } = await params;
  const event_id    = Number(eventId);

    if (isNaN(event_id)) return { title: 'Event Not Found - Admin | SnowScore' };

    const judgingPanels = await fetchJudgingPanelDataByEventId(event_id);
    if (!judgingPanels) return { title: 'Event Not Found - Admin | SnowScore' };
    return {
        title: `Judging Panel: ${judgingPanels.name} | Admin | SnowScore`,
        description: `Administrative dashboard for the event: ${judgingPanels.name}.`,
    };
}

export default async function JudgingPanelPage({params} : JudgingPanelPageProps ) {
   const {
     eventId,
     divisionId,
     roundId,
     roundHeatId,
     personnelId,
   } = await params;
 
   const event_id      = Number(eventId);
   const division_id   = Number(divisionId);
   const round_id      = Number(roundId);
   const round_heat_id = Number(roundHeatId);
   const personnel_id  = Number(personnelId);

    return (
      <div>
        <div>{event_id}</div>
        <div>{division_id}</div>
        <div>{round_id}</div>
        <div>{round_heat_id}</div>
        <div>{personnel_id}</div>
      </div>
  );
}