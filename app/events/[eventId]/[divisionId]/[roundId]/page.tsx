"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import BlankHeader from "@/components/blankHeader";
import { MapPinIcon } from "@heroicons/react/24/outline";
import {Info} from 'lucide-react';


type RoundHeatData = {
  eventId: number;
  divisionId: number;
  roundId: number;
  roundHeatId: number;
  roundName: string;
};

type HeatData = {
  athleteId: number;
  firstName: string;
  lastName: string;
  bestScore: number | null;
  seeding: number;
  bib_num: number;
  heat_num: number;
};
type EventData = { 
  name: string | null;
  error?: string
};

export default function HeatResultsPage() {
  const { eventId, divisionId, roundId } = useParams() as Record<string, string>;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  const [roundHeatData, setRoundHeatData] = useState<RoundHeatData | null>(null);
  const [results, setResults] = useState<HeatData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>("");

  const fetchData = async () => {
    setError(null);
    try {
      // fetch round details
      const res1 = await fetch(
        `${base}/api/public-leaderboard-preset-data-jdn1hd1728g621ifkg4plh5mo?eventId=${eventId}&divisionId=${divisionId}&roundId=${roundId}`
      );
      if (!res1.ok) throw new Error("Failed to fetch round heat data");

      const details = (await res1.json()) as any[];
      if (details.length) {
        const d = details[0];
        setRoundHeatData({
          eventId: d.event_id,
          divisionId: d.division_id,
          roundId: d.round_id,
          roundHeatId: d.round_heat_id,
          roundName: d.round_name,
        });
      }

      const res2 = await fetch(
        `${base}/api/get-public-event-data-dj29g4u8gjdd128jhd?event_id=${eventId}`
      )
      if (!res2.ok) throw new Error("Failed to fetch round heat data");

      const data: EventData = await res2.json();
      setEventName(data.name ?? "");
      


      // fetch non-null and null results
      const [respNotNull, respNull] = await Promise.all([
        fetch(
          `${base}/api/public-round-data-notnull-dd21h8u1289u91288og5?eventId=${eventId}&divisionId=${divisionId}&roundId=${roundId}`
        ),
        fetch(
          `${base}/api/public-round-data-null-dd21h8u1289u91288og5?eventId=${eventId}&divisionId=${divisionId}&roundId=${roundId}`
        ),
      ]);
      if (!respNotNull.ok || !respNull.ok) throw new Error("Failed to fetch heat data");

      const notNullRows = (await respNotNull.json()) as any[];
      const nullRows = (await respNull.json()) as any[];

      // Combine and map into your typed shape
      const played: HeatData[] = notNullRows.map((r) => ({
        athleteId: r.athlete_id,
        firstName: r.first_name,
        lastName: r.last_name,
        bestScore: r.best,
        seeding: r.seeding,
        bib_num: r.bib_num,
        heat_num: r.heat_num,
      }));
      const notPlayed: HeatData[] = nullRows.map((r) => ({
        athleteId: r.athlete_id,
        firstName: r.first_name,
        lastName: r.last_name,
        bestScore: null,
        seeding: r.seeding,
        bib_num: r.bib_num,
        heat_num: r.heat_num,
      }));

      setResults([...played, ...notPlayed]);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId, divisionId, roundId]);

  // group results by heat_num
  const resultsByHeat = useMemo(() => {
    return results.reduce<Record<number, HeatData[]>>((acc, r) => {
      if (!acc[r.heat_num]) acc[r.heat_num] = [];
      acc[r.heat_num].push(r);
      return acc;
    }, {});
  }, [results]);

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-base-200 min-h-screen">
      <BlankHeader />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-base-100 p-6 md:p-10 rounded-2xl shadow-xl">
          <div className="border-b border-base-300 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight leading-tight">
                  {eventName}
                </h1>
              </div>
            </div>
          </div>


          {roundHeatData && (
            <div className="flex">
              <h2 className="text-3xl font-bold mb-6">
                ROUND: {roundHeatData.roundName} 
              </h2>          
              <button
                onClick={fetchData}
                className="btn bg-blue-600 text-white rounded ml-auto hover:bg-blue-700"
                >
                Refresh
            </button>

            </div>
          )}

          {/* Pair tables side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[50%] overflow-auto">
            {Object.entries(resultsByHeat).map(([heatNum, athletes]) => (
              <div key={heatNum} className="mt-[5%]">
                <h3 className="text-2xl font-bold text-center mb-[4%]">HEAT {heatNum}</h3>
                <table className="min-w-full border-collapse mb-4">
                  <thead>
                    <tr>
                      <th className="border px-3 py-2 text-center">RANK</th>
                      <th className="border px-3 py-2 text-center">BIB</th>
                      <th className="border px-3 py-2 text-center">ATHLETE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athletes.map((athlete, index) => (
                      <tr key={athlete.athleteId} className={`${athlete.bestScore ? '' : 'italic'}`}>
                        <td className="border px-3 py-2 align-top text-center">{athlete.bestScore ? index + 1 : '-'}</td>
                        <td className="border px-3 py-2 align-top text-center">{athlete.bib_num}</td>
                        <td className="border px-3 py-2 align-top text-center">{athlete.firstName} {athlete.lastName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="italic">Unranked athletes have yet to compete.</div>
          <div className="mt-[2%]">The results here displayed are subjected to change. </div>
        </div>
      </div>
    </div>
  );
}
