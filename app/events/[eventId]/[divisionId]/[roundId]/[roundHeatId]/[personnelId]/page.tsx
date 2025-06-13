// app/admin/(detail)/events/[eventId]/[judgingPanel]page.tsx
'use client'
import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchEventById } from '@/lib/data';
import { formatDate, formatDateRange } from '@/lib/utils';
import type { EventDetails } from '@/lib/definitions';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your auth helper
import type { AppUserWithRole } from '@/lib/auth/user';
import type { Metadata } from 'next';
// Note: AdminHeader should be in app/admin/layout.tsx, not directly here.
// If you need to pass eventName to it, that's a more advanced layout composition.
// For now, this page assumes AdminHeader is rendered by the layout.


type JudgingPanelPageProps = {
  params:{
    event_id: number;
    division_id: number;
    round_id: number;
    round_heat_id: number;
    personnel_id: number
  };
};

type AthleteRun = {
  athlete_id: number;
  bib: number;
  round_heat_id: number;
  runs: number[];
};

export async function generateMetadata({params} : JudgingPanelPageProps ): Promise<Metadata> {
    const eventId = Number(params.event_id);
    if (isNaN(eventId)) return { title: 'Event Not Found - Admin | SnowScore' };

    const event = await fetchEventById(eventId);
    if (!event) return { title: 'Event Not Found - Admin | SnowScore' };
    return {
        title: `Judging Panel: ${event.name} | Admin | SnowScore`,
        description: `Administrative dashboard for the event: ${event.name}.`,
    };
}

export default async function JudgingPanelPage({params} : JudgingPanelPageProps ) {
    const eventId = Number(panel.event_id);

    const panel2: Panel = await fetch("/api/uniqueJudgingPanel")
      .then((res) => res.json())
      .then((data) => {
        if (
          data &&
          data.event_id &&
          data.division_id &&
          data.round_id &&
          data.round_heat_id &&
          data.personnel_id
        ) {
          return {
            event_id: data.event_id,
            division_id: data.division_id,
            round_id: data.round_id,
            round_heat_id: data.round_heat_id,
            personnel_id: data.personnel_id,
          } as AdminJudgingPanelDetailPageProps;
        }
        // Fallback: throw or return a default object
        throw new Error("Invalid panel data");
      })
      .catch((err) => {
        // Handle error, e.g., return a default object or rethrow
        console.error("Failed to fetch panel data", err);
        // You can throw or return a default object, depending on your needs
        throw err;
      });

      const divisionId = panel.division_id;
      const roundId = panel.round_id;
      const roundHeatId = panel.round_heat_id;
      const personnelId = panel.personnel_id;

    // replicate to other params
    if (isNaN(eventId)) {
        notFound();
    }

    const event: EventDetails | null = await fetchEventById(eventId);

    if (!event) {
        notFound();
    }


    // Get data about the judges
    useEffect(() => {
          fetch("/api/everyJudgingPanelFromAnEvent")
          .then((res) => res.json())
          .then((data) => {

              // assign the fetched data into variables? these should be aligned with the interface AdminJudgingPanelDetailPageProps
          })

      .catch((err) => {
        console.error("Failed to load athletes", err);
        setAthletes([]);
      });
  }, []);


  const[panel, setPanel] = useState();














// ------------------ 

  const keys = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "CLEAR",
  ] as const;

  const [athletes, setAthletes] = useState<AthleteRun[]>([]);
  const [score, setScore] = useState("");
  const [runNum, setRunNum] = useState<number | null>(null);
  const [roundHeatId, setRoundHeatId] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ bib: number; run: number } | null>(null);








  useEffect(() => {
    fetch("/api/athletes")
      .then((res) => res.json())
      .then((data) => {
        data.map
        setAthletes(cleanData);
      })

      .catch((err) => {
        console.error("Failed to load athletes", err);
        setAthletes([]);
      });
  }, []);















  const handleClick = (value: string) => {
    if (value === "CLEAR") {
      setScore("");
    } else {
      setScore((prev) => (prev + value).slice(0, 3));
    }
  };

  const handleSubmit = async () => {
    const personnel_id = 1;

    console.log("SUBMITTING:", {
      roundHeatId,
      runNum,
      personnel_id,
      score,
    });

    if (!roundHeatId || !runNum || !score) {
      alert("Missing fields");
      return;
    }

    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round_heat_id: roundHeatId,
        run_num: runNum,
        personnel_id,
        score: parseFloat(score),
      }),
    });

    const data = await response.json();
    console.log("Score submission response:", data);
  };

// ------------------














    return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-md mx-auto">
      {/* Score Display */}
      <div className="text-4xl font-bold bg-green-100 p-4 rounded w-full text-center min-h-[3rem]">
        {score}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!roundHeatId || !runNum || !score}
        className="btn bg-orange-600 text-white w-full disabled:opacity-50"
      >
        SUBMIT
      </button>

      {/* Dynamic Athlete Run Grid */}
      <div className="w-full">
        <div className="grid grid-cols-6 gap-1 text-sm font-semibold text-center mb-2">
          <div>BIB</div>
          {[1, 2, 3, 4, 5].map((run) => (
            <div key={run}>Run {run}</div>
          ))}
        </div>

        {athletes.map(({ bib, round_heat_id: rhid, runs }) => (
          <div key={bib} className="grid grid-cols-6 gap-1 text-center mb-1">
            <div className="bg-gray-100 p-1">{bib}</div>
            {[1, 2, 3, 4, 5].map((rNum) => {
              const enabled = runs.includes(rNum);
              return (
                <button
                  key={rNum}
                  disabled={!enabled}
                  onClick={() => {
                    if (!enabled) return;
                    setRoundHeatId(rhid);
                    setRunNum(rNum);
                    setSelected({ bib, run: rNum });
                  }}
                  className={`p-1 border border-gray-300 ${
                    selected?.bib === bib && selected?.run === rNum
                      ? "bg-blue-300"
                      : "bg-white"
                  } ${
                    !enabled
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-blue-100"
                  }`}
                >
                  +
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => handleClick(key)}
            className={`btn text-lg ${
              key === "CLEAR" ? "col-span-2 bg-yellow-400" : "bg-yellow-300"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>




    );
}