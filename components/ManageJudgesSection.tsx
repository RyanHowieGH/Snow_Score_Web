import React from 'react'
import JudgeQRCode from '@/components/JudgeQRCode'
import { fetchJudgingPanelDataByEventId } from '@/lib/data'
import type { JudgingPanelPerEvent } from '@/lib/definitions'

// Interfaces for the nested Maps
export interface PersonnelMap {
  [personnelId: string]: {
    judgeName: string,
    judgeHeader: string,
    personnelId: number,
    passcode: number,
  }
}
export interface HeatMap {
  [heatId: string]: {
    heatNumber: number,
    personnels: PersonnelMap,
  }
}
export interface RoundMap {
  [roundId: string]: {
    roundName: string,
    heats: HeatMap,
  }
}
export interface DivisionMap {
  [divisionId: string]: {
    divisionName: string,
    rounds: RoundMap,
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
        personnelId: panel.personnel_id,
        passcode: panel.passcode,
      }
    }
  })

  return (
    <div className="space-y-6">
      {Object.entries(panelsMap).map(([divisionId, { divisionName, rounds }]) => (
        <div key={divisionId} className="card mb-10">
          <div className="card-body space-y-4">
            <h2 className="card-title text-4xl font-bold text-primary">DIVISION: {divisionName}</h2>
            {Object.entries(rounds).map(([roundId, { roundName, heats }]) => (
              <div key={roundId} className="space-y-3">
                <h3 className="font-semibold text-secondary text-2xl mt-5">ROUND: {roundName}</h3>
                {Object.entries(heats).map(([heatId, { heatNumber, personnels }]) => (
                  <div key={heatId} className="space-y-2">
                    <h4 className="text-xl font-bold">HEAT: {heatNumber}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Object.values(personnels).map((personnel, index) => (
                        <div key={index} className="text-center space-y-2">
                          <span className="font-semibold text-base-content text-xl">
                            {personnel.judgeName || personnel.judgeHeader || "The name and header of this judge is unknown. Please edit it to assign a name or header."}
                          </span>
                          <div className="mt-1">
                            {JudgeQRCode(
                              eventId,
                              divisionId,
                              roundId,
                              heatId,
                              String(personnel.personnelId),
                              personnel.passcode
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}