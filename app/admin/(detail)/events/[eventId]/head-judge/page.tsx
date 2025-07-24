"use client";
import HeatTable from "@/components/HeatTable";
import Standing from "@/components/Standings";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";
import RefreshSwitchButton from "./components/RefreshSwitchButton";
import type { HeatHJData, ScoresHJData } from "@/lib/definitions";

type StandingData = {
  athlete: string;
  runs: (number | string)[];
  round_heat_id: number[];
};

const HeadJudgePanel = () => {
  const { eventId } = useParams();
  const parsedEventId = eventId ? parseInt(eventId as string, 10) : null;
  const [heats, setHeats] = useState<HeatHJData[]>([]);
  const [standings, setStandings] = useState<StandingData[]>([]);
  const [selectedDivisionId, setSeletectedDivisionId] = useState();
  const [selectedRoundId, setSeletectedRoundId] = useState();
  const [selectedHeatId, setSeletectedHeatId] = useState();


  // Data refresh per time interval
  const [refreshPageFlag, setRefreshPageFlag] = useState<boolean>(true);
  const [liveSwitch, setLiveSwitch] = useState<boolean>(false);
  const handleOnLiveToggle = () => {setLiveSwitch((prev) => !prev);};
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

  useEffect(() => {
    if (!parsedEventId) return;

    fetch(`/api/get-division-round-heat?event_id=${parsedEventId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API heats data:", data);
        setHeats(
          data.map((heat: HeatHJData) => ({
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
        console.error("Failed to fetch head judge panel data", err);
        setHeats([]);
        setStandings([]);
      });
  }, [refreshPageFlag]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with button on the right */}
      <div className="flex justify-end p-4">
        <RefreshSwitchButton onLiveToggle={handleOnLiveToggle} />
      </div>
      <div className="flex flex-1">
        {/* Left: heat tables */}
        <div className="flex-1 p-6 bg-gray-100 grid grid-cols-1 gap-6">
          {Array.from(
            new Set(
              heats.flatMap((h) =>
                Array.isArray(h.round_heat_id)
                  ? h.round_heat_id
                  : [h.round_heat_id]
              )
            )
          ).map((roundHeatId) => (
            <HeatTable
              key={roundHeatId}
              title={`Heat ${roundHeatId} Judge Scores`}
              data={heats
                .filter((h) =>
                  Array.isArray(h.round_heat_id)
                    ? h.round_heat_id.includes(roundHeatId)
                    : h.round_heat_id === roundHeatId
                )
                .map((heat, i) => ({
                  bib: heat.bib,
                  athlete: heat.athlete,
                  seeding,
                  runs: heat.runs,
                  best: heat.best,
                }))}
            />
          ))}
        </div>

        {/* Right: standings */}
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
    </div>
  );
};

export default HeadJudgePanel;
