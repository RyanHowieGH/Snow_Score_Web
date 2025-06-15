


// app/admin/(detail)/events/[eventId]/manage-athletes/page.tsx
import React from 'react'
import { notFound } from 'next/navigation'
import ManageJudgingPanelsDisplay from '../../../../../../components/ManageJudgesSection'
import { fetchJudgingPanelDataByEventId } from '@/lib/data'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const eventIdString = params?.eventId;
    if (typeof eventIdString !== 'string') return { title: 'Invalid Event ID Type' };
    const eventId = parseInt(eventIdString, 10);
    if (isNaN(eventId)) return { title: 'Invalid Event' };
    const jugdingPanelDetails = await fetchJudgingPanelDataByEventId(eventId);
    return {
        title: jugdingPanelDetails ? `Event: ${jugdingPanelDetails[0]?.name}` : 'Manage Event Judges',
    };
}

export default async function ManageJudgingPanelsPage({params}: {params: { eventId: string }}) {

    const { eventId } = await params

    return (
            <ManageJudgingPanelsDisplay 
            eventId={ eventId } />
        )
    }







// SAVEPOINT: the page below is the one before turning its content into a component

//// app/admin/(detail)/events/[eventId]/manage-athletes/page.tsx
// import { fetchJudgingPanelDataByEventId } from '@/lib/data';
// import type { Metadata } from 'next';
// import type { JudgingPanelPerEvent } from '@/lib/definitions';
// import JudgeQRCode from '../../../../../../components/JudgeQRCode';

// export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
//     const eventIdString = params?.eventId;
//     if (typeof eventIdString !== 'string') return { title: 'Invalid Event ID Type' };
//     const eventId = parseInt(eventIdString, 10);
//     if (isNaN(eventId)) return { title: 'Invalid Event' };
//     const jugdingPanelDetails = await fetchJudgingPanelDataByEventId(eventId);
//     return {
//         title: jugdingPanelDetails ? `Manage Divisions: ${jugdingPanelDetails[0]?.name}` : 'Manage Event Divisions',
//     };
// }

// // Interfaces for the nested Maps
// interface DivisionMap {
//     [divisionId: string]: {
//         divisionName: string
//         rounds:       RoundMap
//     }
// }
//     interface RoundMap {
//         [roundId: string]: {
//             roundName: string
//             heats:     HeatMap
//         }
//     }
//         interface HeatMap {
//             [roundHeatId: string]: {
//                 heatNumber: number
//                 personnels: PersonnelMap
//             }
//         }
//             interface PersonnelMap {
//                 [personnelId: string]: {
//                     judgeName:   string
//                     judgeHeader: string
//                     personnelId: number
//                 }
//             }

// export default async function ManageJudingPanelsPage({ params } : { params: any}) {

//     const {
//         eventId
//     } = await params;

//     const panels: JudgingPanelPerEvent [] | null = await fetchJudgingPanelDataByEventId(eventId);

//     if (!panels || panels.length === 0) {
//         return (
//             // TOCONSIDER: we can be more specific about why there is no judging panel available (?)
//             <div
//             className='text-black'>
//                 No judging panel found for this event.
//             </div>
//         )
//     }

//     // First level of the map
//     const panelsMap: DivisionMap = {}

//     // Place each panel into the maps
//     panels.forEach(panel => {
//         const divisionKey  = String(panel.division_id)
//         const roundKey     = String(panel.round_id)
//         const heatKey      = String(panel.round_heat_id)
//         const personnelKey = String(panel.personnel_id)

//         // Allocate the panel data into Divisions
//         if (!panelsMap[divisionKey]) {
//         panelsMap[divisionKey] = {
//             divisionName: panel.division_name,
//             rounds: {},
//         }
//         }
//         const divisionGroup = panelsMap[divisionKey]

//         // Allocate the panel data into Rounds
//         if (!divisionGroup.rounds[roundKey]) {
//         divisionGroup.rounds[roundKey] = {
//             roundName: panel.round_name,
//             heats: {},
//         }
//         }
//         const roundGroup = divisionGroup.rounds[roundKey]

//         // Allocate the panel data into Heats
//         if (!roundGroup.heats[heatKey]) {
//         roundGroup.heats[heatKey] = {
//             heatNumber: panel.heat_num,
//             personnels: {},
//         }
//         }
//         const heatGroup = roundGroup.heats[heatKey]

//         // Allocate the panel data into Personnel
//         if (!heatGroup.personnels[personnelKey]) {
//         heatGroup.personnels[personnelKey] = {
//             judgeHeader: panel.judge_header,
//             judgeName: panel.judge_name,
//             personnelId: panel.personnel_id,
//         }
//         }
//     })

//     return (
//     <div className="text-black p-4">
//         {Object.entries(panelsMap).map(([divisionId, { divisionName, rounds }]) => (
//             <div key={divisionId} className="mb-8">
//                 <h1 className="text-2xl font-bold">Division: {divisionName}</h1>
//                 <div className="pl-4">
//                     {Object.entries(rounds).map(([roundId, { roundName, heats }]) => (
//                     <div key={roundId} className="mb-6">
//                         <h2 className="text-xl font-semibold">Round: {roundName}</h2>
//                         <div className="pl-4">
//                         {Object.entries(heats).map(
//                             ([heatId, { heatNumber, personnels }]) => (
//                             <div key={heatId} className="mb-4">
//                                 <h3 className="text-lg font-medium">
//                                 Heat: {heatNumber}
//                                 </h3>
//                                 <div className="pl-4 list-disc flex gap-5 mt-5">
//                                 {Object.values(personnels).map((personnel, index) => (
//                                     <div 
//                                     key={index}
//                                     className='text-center text-xl font-bold'>
//                                         {personnel.judgeName || personnel.judgeHeader || "The name and header of this judge is unknown. Please edit it to assign a name or header."}
//                                         <div
//                                         className='mt-5'>
//                                             {JudgeQRCode(
//                                             eventId,
//                                             divisionId,
//                                             roundId,
//                                             heatId,
//                                             String(personnel.personnelId)
//                                              )}
//                                         </div>
//                                     </div>
//                                 ))}
//                                 </div>
//                             </div>
//                             )
//                         )}
//                         </div>
//                     </div>
//                     ))}
//                 </div>
//             </div>
//         ))}
//     </div>
//   )
// }