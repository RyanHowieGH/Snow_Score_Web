import React from "react";
import { notFound, redirect} from "next/navigation";
import { getAuthenticatedUserWithRole } from "@/lib/auth/user";
import { checkEventExistanceById } from "@/lib/data";
import type { CompetitionHJData, DivisionHJData, RoundHJData, HeatHJData } from "@/lib/definitions";
import HeadJudgePanelCompetitionData from "@/components/head-judge-panel/HeadJudgePanelCompetitionData";

export default async function HeadJudgePanelPage ({ params }: { params: { eventId: string } }) {
    const eventIdString = params.eventId;
    const eventId = parseInt(eventIdString);
    if (isNaN(eventId)) {
        notFound();
    }
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition', 'Head Judge'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin');
    }

    

    const eventIdInDb = await checkEventExistanceById(eventId);
    if (!eventIdInDb) {
        notFound();
    }

    return(
        <div>
            <HeadJudgePanelCompetitionData 
                event_id={eventId}
            />
        </div>
    )
}