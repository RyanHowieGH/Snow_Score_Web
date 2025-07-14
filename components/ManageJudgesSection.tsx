'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import JudgeQRCode from '@/components/JudgeQRCode'

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

export interface JudgingPanelPerEventProps {
  panels: JudgingPanelPerEvent[] | null,
  event_id: number,
}

export interface JudgingPanelPerEvent {
    event_id: number;
    division_id: number;
    division_name: string;
    round_id: number;
    round_heat_id: number;
    heat_num: number;
    personnel_id: number;
    name: string;
    round_name: string;
    judge_name: string;
    judge_header: string;
    passcode: number;
}

export default function ManageJudgingPanelsDisplay({ event_id, panels: panels }: JudgingPanelPerEventProps) {

  const [renderedPanels, setRenderedPanels] = useState(panels);

  if (!renderedPanels || renderedPanels.length === 0) {
    return (
      <div className="text-black p-4">
        No judging panel found for this event.
      </div>
    )
  }

  const eventId = event_id;

  const panelsMap: DivisionMap = {}

  renderedPanels.forEach(panel => {
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

  const handleAddJudgeToHeat = () => {

  }

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
                    <div >  
                     <div className="flex justify-between items-center">
                      <h4 className="text-xl font-bold">HEAT: {heatNumber}</h4>
                      <button 
                      className="btn bg-green-500 text-white w-[10%] ml-[0] mb-[1%]">
                        Add judge</button>
                    </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.values(personnels).map((personnel, index) => (
                          <div key={index} className="text-center space-y-2">
                            <span className="font-semibold text-base-content text-xl">
                              {personnel.judgeName || personnel.judgeHeader || "Unknown"}
                            </span>
                            <div className="mt-1">
                              {JudgeQRCode(
                                String(eventId),
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