"use client";
import HeatTable from "../../../../components/HeatTable";
import Standing from "../../../../components/Standings";
import { useEffect, useState } from "react";

type HeatData = {
  bib: number;
  athlete: string;
  rank: number;
  run1: number | string;
  run2: number | string;
  runs: (number | string)[];
  best: number | string;
  round_heat_id: number;
};

type StandingData = {
  athlete: string;
  runs: (number | string)[];
  round_heat_id: number;
};

const Page = () => {
  const [heats, setHeats] = useState<HeatData[]>([]);
  const [standings, setStandings] = useState<StandingData[]>([]);

  useEffect(() => {
    const fetchHeats = async () => {
      try {
        const response = await fetch("/api/Heats");
        if (!response.ok) {
          throw new Error("Failed to fetch heats");
        }
        const data = await response.json();
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
      } catch (err) {
        console.error("Error fetching heats:", err);
        setHeats([]);
        setStandings([]);
      }
    };

    fetchHeats();
  }, []);

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 bg-gray-100 grid grid-cols-1 gap-6">
        <HeatTable
          title="Heat 1 Judge Scores"
          data={heats
            .filter((heat) => heat.round_heat_id === 1)
            .map((heat, index) => ({
              bib: heat.bib,
              athlete: heat.athlete,
              rank: index + 1,
              run1: heat.run1,
              run2: heat.run2,
              best: heat.best,
            }))}
        />
        <HeatTable
          title="Heat 2 Judge Scores"
          data={heats
            .filter((heat: HeatData) => heat.round_heat_id === 2)
            .map((heat: HeatData, index: number) => ({
              bib: heat.bib,
              athlete: heat.athlete,
              rank: index + 1,
              run1: heat.run1,
              run2: heat.run2,
            }))}
        />
      </main>

      <aside className="w-96 p-6 bg-white space-y-6">
        <Standing
          title="Heat 1 Standings"
          data={standings
            .filter((s: StandingData) => s.round_heat_id === 1)
            .map((s: StandingData) => ({
              athlete: s.athlete,
              best: s.runs,
            }))}
        />
        <Standing
          title="Heat 2 Standings"
          data={standings
            .filter((s: StandingData) => s.round_heat_id === 2)
            .map((s: StandingData) => ({
              athlete: s.athlete,
              best: s.runs,
            }))}
        />
      </aside>
    </div>
  );
};

export default Page;
