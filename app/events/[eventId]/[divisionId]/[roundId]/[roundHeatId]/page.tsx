'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AthleteList from '@/components/AthleteList';

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
  bestScore: number;
  seeding: number;
  bib_num: number;
};

export default function Page() {
  // 🔑 grab your route params here
  const { eventId, divisionId, roundId, roundHeatId } = useParams() as {
    eventId: string;
    divisionId: string;
    roundId: string;
    roundHeatId: string;
  };

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';

  const [roundHeatData, setRoundHeatData] = useState<RoundHeatData | null>(null);
  const [heatDataArr, setHeatDataArr] = useState<HeatData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setError(null);

    try {
      // 1) details
      const res1 = await fetch(
        `${base}/api/public-leaderboard-preset-data?eventId=${eventId}&divisionId=${divisionId}&roundId=${roundId}&roundHeatId=${roundHeatId}`
      );
      if (!res1.ok) throw new Error('Failed to fetch round heat data');
      const details = (await res1.json()) as {
        event_id: number;
        division_id: number;
        round_id: number;
        round_heat_id: number;
        round_name: string;
      }[];
      if (details.length > 0) {
        const d = details[0];
        setRoundHeatData({
          eventId: d.event_id,
          divisionId: d.division_id,
          roundId: d.round_id,
          roundHeatId: d.round_heat_id,
          roundName: d.round_name,
        });
      }

      // 2) results
      const res2 = await fetch(
        `${base}/api/public-round-data?eventId=${eventId}&divisionId=${divisionId}&roundId=${roundId}&roundHeatId=${roundHeatId}`,
        { cache: 'no-store' }
      );
      if (!res2.ok) throw new Error('Failed to fetch heat data');
      const rows = (await res2.json()) as {
        athlete_id: number;
        first_name: string;
        last_name: string;
        best: number;
        seeding: number;
        bib_num: number;
      }[];
      setHeatDataArr(
        rows.map((r) => ({
          athleteId: r.athlete_id,
          firstName: r.first_name,
          lastName: r.last_name,
          bestScore: r.best,
          seeding: r.seeding,
          bib_num: r.bib_num,
        }))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [base, eventId, divisionId, roundId, roundHeatId]);

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1>Heat Results</h1>
      <button
        onClick={fetchData}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Refresh
      </button>

      {roundHeatData ? (
        <div>
          <h2 className="text-xl font-semibold">{roundHeatData.roundName}</h2>
          <div className="list-disc ml-5">
            {heatDataArr.map((athlete) => (
              <div key={athlete.athleteId}>
                {athlete.firstName} {athlete.lastName} – Score: {athlete.bestScore} (Seed: {athlete.seeding}) BIB: {athlete.bib_num}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>Loading…</div>
      )}
    </div>
  );
}

