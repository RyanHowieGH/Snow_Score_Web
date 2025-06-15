import React from 'react'
import JudgeQRCode from '@/components/JudgeQRCode'
import { fetchJudgingPanelDataByEventId } from '@/lib/data'
import type { JudgingPanelPerEvent } from '@/lib/definitions'

// Interfaces for the nested Maps
export interface PersonnelMap {
  [personnelId: string]: {
    judgeName: string
    judgeHeader: string
    personnelId: number
  }
}
export interface HeatMap {
  [heatId: string]: {
    heatNumber: number
    personnels: PersonnelMap
  }
}
export interface RoundMap {
  [roundId: string]: {
    roundName: string
    heats: HeatMap
  }
}
export interface DivisionMap {
  [divisionId: string]: {
    divisionName: string
    rounds: RoundMap
  }
}

interface DisplayProps {
  eventId: string
}

export default async function ManageJudgingPanelsDisplay({ eventId }: DisplayProps) {
  
    const panels: JudgingPanelPerEvent[] | null = await fetchJudgingPanelDataByEventId(Number(eventId))

  if (!panels || panels.length === 0) {
    return (
      <div className="text-black p-4">
        No judging panel found for this event.
      </div>
    )
  }

  const panelsMap: DivisionMap = {}

  panels.forEach(panel => {
    const divisionKey = String(panel.division_id)
    const roundKey = String(panel.round_id)
    const heatKey = String(panel.round_heat_id)
    const personnelKey = String(panel.personnel_id)

    if (!panelsMap[divisionKey]) {
      panelsMap[divisionKey] = {
        divisionName: panel.division_name,
        rounds: {}
      }
    }
    const divisionGroup = panelsMap[divisionKey]

    if (!divisionGroup.rounds[roundKey]) {
      divisionGroup.rounds[roundKey] = {
        roundName: panel.round_name,
        heats: {}
      }
    }
    const roundGroup = divisionGroup.rounds[roundKey]

    if (!roundGroup.heats[heatKey]) {
      roundGroup.heats[heatKey] = {
        heatNumber: panel.heat_num,
        personnels: {}
      }
    }
    const heatGroup = roundGroup.heats[heatKey]

    if (!heatGroup.personnels[personnelKey]) {
      heatGroup.personnels[personnelKey] = {
        judgeName: panel.judge_name,
        judgeHeader: panel.judge_header,
        personnelId: panel.personnel_id
      }
    }
  })

    return (
    <div className="text-black p-4">
        {Object.entries(panelsMap).map(([divisionId, { divisionName, rounds }]) => (
            <div key={divisionId} className="mb-8">
                <h1 className="text-2xl font-bold">Division: {divisionName}</h1>
                <div className="pl-4">
                    {Object.entries(rounds).map(([roundId, { roundName, heats }]) => (
                    <div key={roundId} className="mb-6">
                        <h2 className="text-xl font-semibold">Round: {roundName}</h2>
                        <div className="pl-4">
                        {Object.entries(heats).map(
                            ([heatId, { heatNumber, personnels }]) => (
                            <div key={heatId} className="mb-4">
                                <h3 className="text-lg font-medium">
                                Heat: {heatNumber}
                                </h3>
                                <div className="pl-4 list-disc flex gap-5 mt-5">
                                {Object.values(personnels).map((personnel, index) => (
                                    <div 
                                    key={index}
                                    className='text-center text-xl font-bold'>
                                        {personnel.judgeName || personnel.judgeHeader || "The name and header of this judge is unknown. Please edit it to assign a name or header."}
                                        <div
                                        className='mt-5'>
                                            {JudgeQRCode(
                                            eventId,
                                            divisionId,
                                            roundId,
                                            heatId,
                                            String(personnel.personnelId)
                                             )}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            )
                        )}
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
  )
}