"use client";
import HeatTable from "../../../../../../../components/HeatTable";
import Standing from "../../../../../../../components/Standings";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";

type HeatData = {
  bib: number;
  athlete: string;
  rank: number;
  run1: number | string;
  run2: number | string;
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
            run1: heat.runs[0] || "DNI",
            run2: heat.runs[1] || "DNI",
            best: heat.runs[0] > heat.runs[1] ? heat.runs[0] : heat.runs[1],
            round_heat_id: heat.round_heat_id,
          }))
        );
        setStandings(
          data.map((standings: StandingData) => ({
            athlete: standings.athlete,
            runs:
              standings.runs[0] > standings.runs[1]
                ? standings.runs[0]
                : standings.runs[1],
            round_heat_id: standings.round_heat_id,
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to load round heat id", err);
        setHeats([]);
        setStandings([]);
      });
  }, [parsedEventId]);

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 bg-gray-100 grid grid-cols-1 gap-6">
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
                run1: heat.run1,
                run2: heat.run2,
                best: heat.best,
              }))}
          />
        ))}
      </main>

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
  );
};

export default HeadJudgePanel;
