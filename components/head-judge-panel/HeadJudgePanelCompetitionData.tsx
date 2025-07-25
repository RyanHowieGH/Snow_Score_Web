"use client"
import React from "react";
import type { CompetitionHJData } from "@/lib/definitions";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import HeadJudgePanelRefresher from "@/components/head-judge-panel/HeadJudgePanelRefresher";
import type { DivisionHJData, RoundHJData, HeatHJData } from "@/lib/definitions";

type PageProps = {
    event_id: number,
}
export default function HeadJudgePanelCoreLive({ event_id }: PageProps) {
  const [competitionData, setCompetitionData] = useState<CompetitionHJData>();

  // division & round stay as single IDs, heat is now an array
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | "">("");
  const [selectedRoundId, setSelectedRoundId] = useState<number | "">("");
  const [selectedHeatIds, setSelectedHeatIds] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/get-division-round-heat?event_id=${event_id}`)
      .then((res) => res.json() as Promise<CompetitionHJData>)
      .then((data) => setCompetitionData(data))
      .catch((err) => {
        console.error("Failed to load competition data.", err);
        notFound();
      });
  }, [event_id]);

  // derive options
  const divisions: DivisionHJData[] = competitionData?.divisions || [];
  const rounds: RoundHJData[] =
    divisions.find((d) => d.division_id === selectedDivisionId)?.rounds || [];
  const heats: HeatHJData[] =
    rounds.find((r) => r.round_id === selectedRoundId)?.heats || [];

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    setSelectedDivisionId(val);
    setSelectedRoundId("");
    setSelectedHeatIds([]);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    setSelectedRoundId(val);
    setSelectedHeatIds([]);
  };

  const handleHeatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "all") {
      // select every heat’s ID
      setSelectedHeatIds(heats.map((h) => h.round_heat_id));
    } else if (e.target.value === "") {
      setSelectedHeatIds([]);
    } else {
      setSelectedHeatIds([parseInt(e.target.value, 10)]);
    }
  };

  // compute the select’s current “value” prop
  const heatSelectValue = (() => {
    if (selectedHeatIds.length === 0) 
        return "";

    if (selectedHeatIds.length === heats.length) 
        return "all";

    return selectedHeatIds[0].toString();
  })();

  

  return (
    <div className="flex">
      <div className="flex items-center space-x-4">
        {/* Division */}
        <div>
            <div
            className="font-semibold mb-2 ml-1">Division</div>
            <select
            value={selectedDivisionId}
            onChange={handleDivisionChange}
            className="px-2 py-1 border rounded"
            >
            <option value="">Select Division</option>
            {divisions.map((d) => (
                <option key={d.division_id} value={d.division_id}>
                {d.division_name}
                </option>
            ))}
            </select>
        </div>


        {/* Round */}
        <div>
            <div
            className="font-semibold ml-1 mb-2">
                Round
            </div>
            <select
            value={selectedRoundId}
            onChange={handleRoundChange}
            disabled={!selectedDivisionId}
            className="px-2 py-1 border rounded disabled:opacity-50"
            >
            <option value="">Select Round</option>
            {rounds.map((r) => (
                <option key={r.round_id} value={r.round_id}>
                {r.round_name}
                </option>
            ))}
            </select>
        </div>


        {/* Heat (with “All”) */}
        <div>
            <div
            className="font-semibold ml-1 mb-2">
                Heat
            </div>
            <select
            value={heatSelectValue}
            onChange={handleHeatChange}
            disabled={!selectedRoundId}
            className="px-2 py-1 border rounded disabled:opacity-50"
            >
            <option value="">Select Heat</option>
            <option value="all">All</option>
            {heats.map((h) => (
                <option key={h.round_heat_id} value={h.round_heat_id}>
                {h.heat_num}
                </option>
            ))}
            </select>
        </div>
      </div>
      <div
      className="w-full flex justify-end items-center border-1 border-solid border-black">
        <button
        className="block w-50 px-4 py-2 bg-white text-black border-1 rounded disabled:opacity-50"
        disabled={selectedHeatIds.length === 0}>
            Generate Panel
        </button>
      </div>

      {/*
      {selectedHeatIds.length > 0 && (
        <HeadJudgePanelRefresher
          division_id={selectedDivisionId as number}
          round_id={selectedRoundId as number}
          round_heat_ids={selectedHeatIds}
        />
      )} */}
    </div>
  );
}