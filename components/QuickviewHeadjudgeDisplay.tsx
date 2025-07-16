'use client'
import React from 'react';
import { useState } from 'react';
import type { EventDetails } from "@/lib/definitions";
import EditHeadJudgeButton from "@/components/EditHeadJudgesButton";

type QuickviewHeadjudgeDisplayProps = {
    event: EventDetails,
    eventId: number;
    userRoleId?: number;
}

export default function QuickviewHeadjudgeDisplay ({event, eventId, userRoleId} : QuickviewHeadjudgeDisplayProps) {

    const [selectedJudge, setSelectedJudge] = useState (
        event.headJudge && event.headJudge.length > 0
                  ? event.headJudge
                      .map((hj) => `${hj.first_name} ${hj.last_name}`)
                      .join(", ")
                  : 
                  "None"
    )

    const handleAssignHeadjudge = (judgeName: string) => {
        setSelectedJudge(judgeName);
    };

    return (
            <div className="flex items-center gap-2 font-medium text-base-content/70">
                Head Judge:{` `}
                <span className="font-normal">
                  {selectedJudge}
                </span>
              
              <EditHeadJudgeButton eventId={eventId} userRoleId={userRoleId} onAssignHeadjudge={handleAssignHeadjudge}/>
            </div>
    )
}
