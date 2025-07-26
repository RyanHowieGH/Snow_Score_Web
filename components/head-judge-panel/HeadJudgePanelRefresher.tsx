"use client"
import React from "react";
import type { CompetitionHJData, ResultsHeatsHJDataMap, RunHJData } from "@/lib/definitions";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import RefreshSwitchButton from "@/components/RefreshSwitchButton";
import HeadJudgeHeatScoringPanel from "@/components/head-judge-panel/HeadJudgeHeatScoringPanel"
import HeadJudgePanelRunCell from "@/components/head-judge-panel/HeadJudgePanelRunCell"
import { table } from "console";
import { formatHeatTime } from "@/lib/utils";

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
    const columnHeaderBibDesign = "w-[10%] mx-auto text-center";
    const columnHeaderRunDesign = "w-[10%] mx-auto text-center";
    const columnHeaderBestDesign = "w-[10%] mx-auto text-center";
    const valuesBestDesign = "font-semibold text-3xl";
    const valuesBibDesign = "font-semibold text-3xl";
    const designBorder = "rounded-lg border-1 border-gray-500";


    return(
      <div className="flex min-h-screen flex-col">
        {/* Top bar with button on the right */}
        <div className="flex justify-end p-4">
          <RefreshSwitchButton onLiveToggle={handleOnLiveToggle} />
        </div>

        <div className="overflow-x-auto">

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
              className=" mb-[5%]">
                  <div className="font-bold text-2xl text-center">        
                    {heat ? `HEAT ${heat.heat_num}` : '—'}
                  </div>
                {/* Heat table title*/}
                <div className="flex w-full mb-[2%]">
                  <div className="flex gap-10 mr-auto items-center">
                    <div className="flex">
                      <div className="font-bold mr-1">
                        START:{` `}
                      </div>
                      <div>
                        {heat?.start_time ? formatHeatTime(heat.start_time) : 'TBD'}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="font-bold mr-1">
                        END:{` `}
                      </div>
                      <div>
                        {heat?.end_time ? formatHeatTime(heat.end_time) : 'TBD'}
                      </div>
                    </div>
                  </div> 
                </div>

                {/* Scrolling area*/}
                <div className="flex">
                <div className="overflow-x-auto w-full">

                  {(() => {
                    return (
                      <div>
                        {/* --------------------------- JUDGE SCORES ---------------------------*/}
                        <div
                          className="text-center text-2xl font-bold mb-[12]">JUDGE SCORES
                        </div>
                        {/* HEADER ROW */}
                        <div className="flex text-xl font-bold">
                            <div className={`${columnHeaderBibDesign}`}>BIB</div>
                            {/* <div className={columnBibLayout}>SEEDING</div> */}
                          {arrayOfRunNum.map(runNum => (
                              <div key={runNum} className={`${columnHeaderRunDesign}`}>
                                RUN {runNum}
                              </div>
                          ))}
                          <div className={`${columnHeaderBestDesign}`}>BEST</div>
                        </div>

                        {/* ATHLETE SPECIFIC DATA */}
                        {(scoreData[roundHeatId]?.athletes ?? []).map((athleteMap) =>
                          Object.entries(athleteMap).map(([athleteId, athlete]) => (
                            <div key={athleteId} className={`flex ${designBorder} items-center justify-center mt-[1%]`}>
                              <div className={`${columnHeaderBibDesign} ${valuesBibDesign}`}>{athlete.bib_num}</div>
                              {/* <div className={`${columnBibLayout}`}>{athlete.seeding}</div> */}
                              
                              {/* RUN DATA */}
                              {(() => {
                                const runNums = Array.from(
                                  new Set(athlete.scores.map(s => Number(Object.keys(s)[0])))
                                );
                                return runNums.map(runNum => {
                                  
                                  const runScores = athlete.scores.filter(
                                    s => Number(Object.keys(s)[0]) === runNum
                                  );
                                  
                                  const runData = runScores[0][runNum];
                                  return (
                                    <div key={`${athleteId}-${runNum}`} 
                                    className={`${columnHeaderRunDesign}`}>
                                      <HeadJudgePanelRunCell
                                        run_result_id={runData.run_result_id}
                                        run_num={runNum}
                                        scorePerRun={{
                                          run_num:     runNum, 
                                          // in case they change their mind and want it later (athlete_name)
                                          athlete_name: "",
                                          bib_num:     athlete.bib_num,
                                          run_average: runData.run_average,
                                          judgesScore: runScores,
                                        }}
                                      />
                                    </div>
                                  );
                                });
                              })()}

                              <div className={`${columnHeaderBibDesign} ${valuesBestDesign}`}>{athlete.best_heat_average}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* ----------------------------  STANDINGS  ---------------------------- */}
                <div className="w-[30%] pl-[1%] mx-auto mt-[-5]">
                  {(() => {
                    // 1) pull & flatten the one‑key maps into an array
                    const athletesRaw = scoreData[roundHeatId]?.athletes ?? [];
                    const athletesList = athletesRaw.flatMap(m => Object.values(m));

                    // 2) sort descending by best_heat_average
                    const sorted = [...athletesList].sort(
                      (a, b) => b.best_heat_average - a.best_heat_average
                    );

                    return (
                      <div className="w-full">
                        <div
                        className="text-center text-2xl font-bold mb-[12]">
                          STANDINGS
                        </div>
                        {/* HEADER ROW */}
                        <div className={`grid grid-cols-3 w-full text-center font-semibold bg-gray-100 py-2`}>
                          <div className={`text-xl font-bold`}>RANK</div>
                          <div className="text-xl font-bold">BIB</div>
                          <div className="text-xl font-bold">BEST</div>
                        </div>

                        {/* DATA ROWS */}
                        <div className={`border-1 rounded-xl border-gray-700`}>
                          {sorted.map((athlete, idx) => (
                            <div
                              key={athlete.athlete_id}
                              className={`grid grid-cols-3 w-full text-center items-center p-[3%] mb-[5%] mt-[4%]`}
                            >
                              <div className={`text-2xl border-r-1 border-gray-700`}>{idx + 1}</div>
                              <div className={`text-2xl border-r-1 border-gray-700`}>{athlete.bib_num}</div>
                              <div className={`text-2xl`}>{athlete.best_heat_average ?? "-"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
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