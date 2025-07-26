"use client"
import React from "react";
import type { CompetitionHJData, ResultsHJDataMap, RunHJData } from "@/lib/definitions";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import RefreshSwitchButton from "@/components/RefreshSwitchButton";
import HeadJudgeHeatScoringPanel from "@/components/head-judge-panel/HeadJudgeHeatScoringPanel"
import HeadJudgePanelRunCell from "@/components/head-judge-panel/HeadJudgePanelRunCell"
import { table } from "console";

type PageProps = {
    eventId: number,
    divisionId: number,
    roundId: number,
    roundHeatIds: number[],
    tableHeaders: CompetitionHJData,
}

export default function HeadJudgePanelCoreLive ({ eventId, roundHeatIds, tableHeaders, divisionId, roundId }: PageProps) {
    const [scoreData, setScoreData] = useState<ResultsHJDataMap>({});

  // --- Data refresh ---
  const [refreshPageFlag, setRefreshPageFlag] = useState<boolean>(true);
  const [liveSwitch, setLiveSwitch] = useState<boolean>(false);

  const handleOnLiveToggle = () => {
    setLiveSwitch((prev) => !prev);
  };

  let refreshInterval: NodeJS.Timeout | null;

  useEffect(() => {
    if (liveSwitch) {
      refreshInterval = setInterval(() => {
        setRefreshPageFlag((prev) => !prev);
      }, 1000);
      console.log("Panel is online");
    }
    if (liveSwitch === false) {
      refreshInterval = null;
      console.log("Panel is offline");
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [liveSwitch]);

    let round_heat_ids_API = roundHeatIds.map(id => `round_heat_id=${id}`).join(`&`);
    
    useEffect(()=> {
        fetch(`/api/get-headjudge-scores?event_id=${eventId}&${round_heat_ids_API}`)
    .then(res => res.json() as Promise<ResultsHJDataMap>)
    .then((data) => setScoreData(data))
        .catch(err => {
            console.error("Failed to load competition data.", err);
            notFound();
        });
    },[refreshPageFlag])

    // Heat table column design
    const columnTextSize = "";
    const columnBibWidth = "w-[10%]";
    const columnRunWidth = "w-[10%]";
    const columnBestWidth = "w-[10%]";



    return(
      <div className="flex min-h-screen flex-col border-1 border-black">
        {/* Top bar with button on the right */}
        <div className="flex justify-end p-4">
          <RefreshSwitchButton onLiveToggle={handleOnLiveToggle} />
        </div>

        <div className="overflow-x-auto w-[80%]">

        <div>
          {roundHeatIds.map(roundHeatId => {      
            
            // We find each round heat id and create a table for each one of them
            const heat = tableHeaders
              .divisions.find(d => d.division_id === divisionId)
              ?.rounds.find(r => r.round_id === roundId)
              ?.heats.find(h => h.round_heat_id === roundHeatId);

            // Array of num of runs
            const arrayOfRunNum = heat
              ? Array.from({ length: heat.num_runs }, (_, i) => i + 1)
              : [];


            return (
              <div 
              key={roundHeatId}
              className="border-1 border-black mb-[5%]">

                {/* Heat table title*/}
                <div className="flex w-full border-1 border-black">
                  <div className="font-bold text-2xl">        
                    {heat ? `HEAT ${heat.heat_num}` : '—'}
                  </div>
                  <div className="flex gap-10 ml-auto items-center">
                    <div className="flex">
                      <div className="font-bold mr-1">
                        START:{` `}
                      </div>
                      <div>
                        {heat?.start_time ? heat.start_time.toLocaleString() : 'TBD'}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="font-bold mr-1">
                        END:{` `}
                      </div>
                      <div>
                        {heat?.end_time ? heat.end_time.toLocaleString() : 'TBD'}
                      </div>
                    </div>
                  </div> 
                </div>

                {/* Scrolling area*/}
                <div className="flex">
                <div className="overflow-x-auto w-full">

                  {(() => {
                    const athleteResults = scoreData[roundHeatId];

                    return (
                      <div>
                        {/* HEADER ROW */}
                        <div className="flex">
                            <div className={columnBibWidth}>BIB</div>
                            <div className={columnBibWidth}>SEEDING</div>
                          {arrayOfRunNum.map(runNum => (
                              <div key={runNum} className={columnRunWidth}>
                                RUN {runNum}
                              </div>
                          ))}
                          <div className={columnBestWidth}>BEST</div>
                        </div>


                        <div className="flex">
                            <div className={columnBibWidth}>{athleteResults?.bib_num}</div>
                            <div className={columnBibWidth}>{athleteResults?.seeding}</div>
                            {arrayOfRunNum.map(runNum => {
                              
                              const runCellData = athleteResults.scores?.[runNum];
                              return(
                                <div key={runNum}>
                                {athleteResults && runCellData && runCellData[runNum] ? (
                                  <HeadJudgePanelRunCell
                                    run_result_id={runCellData[runNum]?.run_result_id}
                                    run_num = {runNum}
                                    scorePerRun={{
                                      run_num: runNum,
                                      athlete_name: "",
                                      bib_num: athleteResults?.bib_num ?? 0,
                                      run_average: athleteResults?.run_average ?? 0,
                                      judgesScore: athleteResults?.scores,
                                    }}
                                  />
                                ) : (
                                  <div className="text-center text-gray-400">—</div>
                                )}
                              </div>
                              )})}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)
}