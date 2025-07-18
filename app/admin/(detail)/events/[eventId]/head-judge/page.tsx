"use client";
import HeatTable from "@/components/HeatTable";
import Standing from "@/components/Standings";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";

type DivisionData = {
  divisionId: number,
  divisionName: string,
  rounds: RoundData[], 
};

type RoundData = {
  roundId: number,
  roundName: string,
  heats: HeatData[],
};

type HeatData = {
  bib: number;
  athlete: string;
  rank: number;
  runs: (number | string)[];
  best: number | string;
  round_heat_id: number[];
};

type StandingData = {
  athlete: string;
  runs: (number | string)[];
  round_heat_id: number[];
};

const HeadJudgePanel = () => {
  const { eventId } = useParams();
  const parsedEventId = eventId ? parseInt(eventId as string, 10) : null;
  const [heats, setHeats] = useState<HeatData[]>([]);
  const [standings, setStandings] = useState<StandingData[]>([]);
  const [selectedDivisionId, setSeletectedDivisionId] = useState();
  const [selectedRoundId, setSeletectedRoundId] = useState();
  const [selectedHeatId, setSeletectedHeatId] = useState();

  const [refreshPageFlag, setRefreshPageFlag] = useState<boolean>(true);

  useEffect (() => {
    const refreshInterval = setInterval(() => {
      setRefreshPageFlag(prev => !prev);
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
    }
  }, [])


  useEffect(() => {
    if (!parsedEventId) return;

    fetch(`/api/Heats?event_id=${parsedEventId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API heats data:", data);
        setHeats(
          data.map((heat: HeatData) => ({
            bib: heat.bib,
            athlete: heat.athlete,
            runs: heat.runs,
            best: Math.max(...heat.runs.map(Number).filter((n) => !isNaN(n))),
            round_heat_id: heat.round_heat_id,
          }))
        );
        setStandings(
          data.map((standings: StandingData) => ({
            athlete: standings.athlete,
            runs: Math.max(
              ...standings.runs.map(Number).filter((n) => !isNaN(n))
            ),
            round_heat_id: standings.round_heat_id,
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to load round heat id", err);
        setHeats([]);
        setStandings([]);
      });  
      
// SWITCH THE THIS DEPENDENCIES TO START/STOP TESTING
  }, [refreshPageFlag]);
  // }, []);



  return (
    <div className="flex min-h-screen">
      {/* <div>
        <div>
          <select
            className="select select-bordered font-normal w-full text-black"
            value={selectedDivisionId}
            onChange={e => {
              const id = e.target.value;
              setSelectedDivisionId(id);
              const hj = headJudges.find(h => String(h.user_id) === id);
              if (hj?.first_name && hj?.last_name) {
                setOnChangeHeadjudgeName(`${hj.first_name} ${hj.last_name}`);
              }
            }}          >
            <option value="" disabled>
              Select head judge
            </option>
            {headJudges.map(hj => (
              <option key={hj.user_id} value={hj.user_id}>
                {hj.first_name} {hj.last_name}
              </option>
            ))}
          </select>
        </div> */}
        <div className="flex-1 p-6 bg-gray-100 grid grid-cols-1 gap-6">
          {Array.from(
            new Set(
              heats.flatMap((heat) =>
                Array.isArray(heat.round_heat_id)
                  ? heat.round_heat_id
                  : [heat.round_heat_id]
              )
            )
          ).map((roundHeatId) => (
            <HeatTable
              key={roundHeatId}
              title={`Heat ${roundHeatId} Judge Scores`}
              data={heats
                .filter((heat) =>
                  Array.isArray(heat.round_heat_id)
                    ? heat.round_heat_id.includes(roundHeatId)
                    : heat.round_heat_id === roundHeatId
                )
                .map((heat, index) => ({
                  bib: heat.bib,
                  athlete: heat.athlete,
                  rank: index + 1,
                  runs: heat.runs,
                  best: heat.best,
                }))}
            />
          ))}
        </div>

        <aside className="w-96 p-6 bg-white space-y-6">
          {Array.from(
            new Set(
              standings.flatMap((s) =>
                Array.isArray(s.round_heat_id)
                  ? s.round_heat_id
                  : [s.round_heat_id]
              )
            )
          ).map((roundHeatId) => (
            <Standing
              key={roundHeatId}
              title={`Heat ${roundHeatId} Standings`}
              data={standings
                .filter((s) =>
                  Array.isArray(s.round_heat_id)
                    ? s.round_heat_id.includes(roundHeatId)
                    : s.round_heat_id === roundHeatId
                )
                .map((s) => ({
                  athlete: s.athlete,
                  best: s.runs,
                }))}
            />
          ))}
        </aside>
      </div>

    // </div>
  );
};

export default HeadJudgePanel;
