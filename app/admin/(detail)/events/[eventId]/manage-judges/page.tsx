// app/admin/(detail)/events/[eventId]/manage-athletes/page.tsx
import { fetchJudgingPanelDataByEventId } from '@/lib/data';
import type { Metadata } from 'next';
import type { JudgingPanelPerEvent } from '@/lib/definitions';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const eventIdString = params?.eventId;
    if (typeof eventIdString !== 'string') return { title: 'Invalid Event ID Type' };
    const eventId = parseInt(eventIdString, 10);
    if (isNaN(eventId)) return { title: 'Invalid Event' };
    const jugdingPanelDetails = await fetchJudgingPanelDataByEventId(eventId);
    return {
        title: jugdingPanelDetails ? `Manage Divisions: ${jugdingPanelDetails[0]?.name}` : 'Manage Event Divisions',
    };
}

export default async function ManageJudingPanelsPage({ params } : { params: any}) {

    const {
        eventId
    } = await params;

    const panels: JudgingPanelPerEvent [] | null = await fetchJudgingPanelDataByEventId(eventId);

    return (
        <div className="text-black">
            aaa
            <ul>
                {panels?.map(panel => {
                    const compositeKey = [
                        panel.division_id,
                        panel.round_id,
                        panel.round_heat_id,
                        panel.personnel_id,
                    ].join('-');

                    return (
                        <li 
                        key={compositeKey}
                        className="mb-10">
                            <h1>Division: {panel.division_name}</h1>
                            <h2>Round: {panel.round_name}</h2>
                            <div>Heat: {panel.round_heat_id}</div>
                            <div>Personnel: {panel.personnel_id}</div>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
}