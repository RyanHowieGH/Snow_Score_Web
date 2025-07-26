"use client"
import React from "react";
import type { CompetitionHJData, ResultsHeatsHJDataMap, RunHJData } from "@/lib/definitions";
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
    const [scoreData, setScoreData] = useState<ResultsHeatsHJDataMap>({});

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
    .then(res => res.json() as Promise<ResultsHeatsHJDataMap>)
    .then((data) => setScoreData(data))
        .catch(err => {
            console.error("Failed to load competition data.", err);
            notFound();
        });
    },[refreshPageFlag])

    // Heat table column design
    const columnTextSize = "";
    const columnBibLayout = "w-[10%]";
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
                            <div className={columnBibLayout}>BIB</div>
                            <div className={columnBibLayout}>SEEDING</div>
                          {arrayOfRunNum.map(runNum => (
                              <div key={runNum} className={columnRunWidth}>
                                RUN {runNum}
                              </div>
                          ))}
                          <div className={columnBestWidth}>BEST</div>
                        </div>

                        {/* Athlete specific data */}
                        {(scoreData[roundHeatId]?.athletes ?? []).map((athleteMap) =>
                          Object.entries(athleteMap).map(([athleteId, athlete]) => (
                            <div key={athleteId} className="flex my-2 p-2 border">
                              <div className={`${columnBibLayout}`}>{athlete.bib_num}</div>
                              <div className={`${columnBibLayout}`}>{athlete.seeding}</div>
                              
                              {(() => {
                                // 1) build the unique list of run numbers
                                const runNums = Array.from(
                                  new Set(athlete.scores.map(s => Number(Object.keys(s)[0])))
                                );

                                // 2) map once per run
                                return runNums.map(runNum => {
                                  // 3) grab all judge‑scores for this run
                                  const runScores = athlete.scores.filter(
                                    s => Number(Object.keys(s)[0]) === runNum
                                  );

                                  // 4) pick one runData to pull run_result_id (they all share it)
                                  const runData = runScores[0][runNum];

                                  return (
                                    <div key={`${athleteId}-${runNum}`} className={columnRunWidth}>
                                      <HeadJudgePanelRunCell
                                        run_result_id={runData.run_result_id}
                                        run_num={runNum}
                                        scorePerRun={{
                                          run_num:     runNum,
                                          athlete_name: "",                // or athlete.athlete_name
                                          bib_num:     athlete.bib_num,
                                          run_average: runData.run_average,
                                          judgesScore: runScores,          // <-- only this run’s judges
                                        }}
                                      />
                                    </div>
                                  );
                                });
                              })()}

                              <div className={`${columnBibLayout}`}>{athlete.best_heat_average}</div>
                            </div>
                          ))
                        )}

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