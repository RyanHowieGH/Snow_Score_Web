"use client"
import React from "react";
import type { CompetitionHJData, ResultsHJDataMap } from "@/lib/definitions";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import RefreshSwitchButton from "@/components/RefreshSwitchButton";
import HeadJudgeHeatScoringPanel from "@/components/head-judge-panel/HeadJudgeHeatScoringPanel"
import RunCell from "@/components/head-judge-panel/HeadJudgePanelRunCell"

type PageProps = {
    event_id: number,
    round_heat_ids: number[],
    tableHeaders: CompetitionHJData,
}

export default function HeadJudgePanelCoreLive ({ event_id, round_heat_ids, tableHeaders }: PageProps) {
    const [scoreData, setScoreData] = useState<ResultsHJDataMap>();

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

    let round_heat_ids_API = round_heat_ids.map(id => `round_heat_id=${id}`).join(`&`);
    
    useEffect(()=> {
        fetch(`/api/get-headjudge-scores?event_id=${event_id}&${round_heat_ids_API}`)
        .then(async (res) => {
            return (await res.json()) as CompetitionHJData;
        })
        .then((res: CompetitionHJData) => {
            setScoreData(res);
        })
        .catch(err => {
            console.error("Failed to load competition data.", err);
            notFound();
        });
    },[refreshPageFlag])



    /////////
interface Score {
  bib: number;
  athlete: string;
  seeding: number;
  run1?: number;
  run2?: number;
  best?: number;
  judgesScoreRun1?: any[];
  judgesScoreRun2?: any[];
  judgesScoreBest?: any[];
}

const scores: Score[] = [
  { bib: 86, athlete: 'Harry Coleman', seeding: 1, best: 0, judgesScoreBest: [] },
  { bib: 46, athlete: 'Eli Bouchard', seeding: 2, run1: 15.67, run2: 93.67, best: 93.67, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 47, athlete: 'Oliver Martin', seeding: 3, run1: 79, run2: 85, best: 85, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 43, athlete: 'Brooklyn DePriest', seeding: 4, run1: 60.5, run2: 70.67, best: 70.67, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 97, athlete: 'Maddox Matte', seeding: 5, run1: 23.67, run2: 69.33, best: 69.33, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 66, athlete: 'Lys Fedorowycz', seeding: 6, run1: 69, best: 69, judgesScoreRun1: [], judgesScoreBest: [] },
  { bib: 74, athlete: 'Kobe Cantelon', seeding: 7, run1: 68.67, best: 68.67, judgesScoreRun1: [], judgesScoreBest: [] },
];

    /////////
    return(
      <div className="flex min-h-screen flex-col border-1 border-black">
        {/* Top bar with button on the right */}
        <div className="flex justify-end p-4">
          <RefreshSwitchButton onLiveToggle={handleOnLiveToggle} />
        </div>



        <div className="overflow-x-auto w-[80%]">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-center font-medium">BIB</th>
                <th className="px-4 py-2 text-center font-medium">SEEDING</th>
                <th className="px-4 py-2 text-center font-medium">RUN 1</th>
                <th className="px-4 py-2 text-center font-medium">RUN 2</th>
                <th className="px-4 py-2 text-center font-medium">BEST</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.bib} className="even:bg-white odd:bg-gray-50">
                  <td className="px-4 py-2">{score.bib}</td>
                  <td className="px-4 py-2">{score.seeding}</td>

                  {/* Run 1 */}
                  <td className="px-4 py-2 border-1 border-black">
                    {score.run1 !== undefined ? (
                      <RunCell                        
                      run_result_id= { 123 }
                      scorePerRun = {{
                        athlete_name: `Tim Smith`,
                        bib_num: 2,
                        run_num: 1, 
                        run_average: 40,
                        judgesScore:
                            [{
                                personnel_id: 10,
                                header: 'Header',
                                name: 'Name',
                                score: 20,
                            }, 
                            {
                                personnel_id: 20,
                                header: 'Header2',
                                name: '',
                                score: 40,
                            }, 
                            ]
                        }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Run 2 cell using HeadJudgePanelRunCell */}
                  <td className="px-4 py-2 border-1 border-black">
                    {score.run2 !== undefined ? (
                      <RunCell                        
                      run_result_id= { 123 }
                      scorePerRun = {{
                        athlete_name: `Tim Smith`,
                        bib_num: 2,
                        run_num: 1, 
                        run_average: 40,
                        judgesScore:
                            [{
                                personnel_id: 10,
                                header: 'Header',
                                name: 'Name',
                                score: 20,
                            }, 
                            {
                                personnel_id: 20,
                                header: 'Header2',
                                name: '',
                                score: 40,
                            }, 
                            ]
                        }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>


                  {/* Best cell using HeadJudgePanelRunCell */}
                  <td className="px-4 py-2 font-semibold">
                    {score.best !== undefined ? (
                      2
                    ) : (
                      '—'
                    )}
                  </td>
            
                </tr>
              ))}

              
            </tbody>
          </table>







        </div>




















        <div>
          {scoreData && (
            <HeadJudgeHeatScoringPanel
            results = {scoreData} />
          )}
        </div>
      </div>
    )
}