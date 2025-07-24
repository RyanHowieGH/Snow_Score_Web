import React from "react";
import { notFound, redirect} from "next/navigation";
import { getAuthenticatedUserWithRole } from "@/lib/auth/user";
import { checkEventExistanceById } from "@/lib/data";
import HeadJudgePanelCoreLive from "@/components/head-judge-panel/HeadJudgePanelCoreLive"


export default async function HeadJudgePanelPage ({ params }: { params: { eventId: string } }) {
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
    const eventIdInDb = await checkEventExistanceById(eventId);
    if (!eventIdInDb) {
        notFound();
    }

    const competitionData = fetch(`/api/best-run-score-per-judge-dh12cm214v98b71ss?round_heat_id=${roundHeatId}&personnel_id=${personnelId}`)
      .then((res => res.ok ? res.json() : []))
      .then((data: BestScore[]) => setBestScores(data))
      .catch(err => {
        console.error("Failed to load best scores", err);
        setBestScores([]);
      });

    return(
        <div>
            <HeadJudgePanelCoreLive />
        </div>
    )
}