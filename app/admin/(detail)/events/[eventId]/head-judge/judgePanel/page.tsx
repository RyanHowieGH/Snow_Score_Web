"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type AthleteRun = {
  athlete_id: number;
  bib: number;
  runs: {
    run_num: number;
    round_heat_id: number;
  }[];
};

export default function ScoreInput() {
  const { eventId } = useParams();
  const parsedEventId = eventId ? parseInt(eventId as string, 10) : null;
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
  const [selected, setSelected] = useState<{
    bib: number;
    run: number;
    athlete_id: number;
  } | null>(null);
  const [eventIsFinished, setEventIsFinished] = useState(false);
  const [submittedScores, setSubmittedScores] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!parsedEventId) return;

    fetch(`/api/athletes?event_id=${parsedEventId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API athletes data:", data);
        setAthletes(data.athletes);
        setEventIsFinished(data.event.status === "completed");
      })
      .catch((err) => {
        console.error("Failed to load athletes or event", err);
        setAthletes([]);
      });
  }, [parsedEventId]);

  const handleClick = (value: string) => {
    if (value === "CLEAR") {
      setScore("");
    } else {
      setScore((prev) => (prev + value).slice(0, 3));
    }
  };

  const handleSubmit = async () => {

    console.log("SUBMITTING:", {
      roundHeatId,
      runNum,
      score,
    });

    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round_heat_id: roundHeatId,
        run_num: runNum,
        score: parseFloat(score),
        athlete_id: selected?.athlete_id,
      }),
    });

    const data = await response.json();
    console.log("Score submission response:", data);

    if (response.ok) {
      setSubmittedScores((prev) => ({
        ...prev,
        [`${selected?.athlete_id}-${runNum}`]: parseFloat(score),
      }));

      setScore("");
    }
    if (eventIsFinished) {
      alert("Event is finished, cannot submit scores.");
      return;
    }
    if (!roundHeatId || !runNum || !score) {
      alert("Please select an athlete and enter a score.");
      return;
    }
  };

  return (
    <div className="flex flex-row-reverse width-full h-screen ">
      <div className=" flex-1/2 p-4 space-y-1">
        {/* Score Display */}
        {selected?.bib && selected?.run && (
          <div className="text-md font-semibold bg-green-100 rounded p-2 text-center">
            ATHLETE BIB: {selected.bib}, CURRENT RUN: {selected.run}
          </div>
        )}
        <div className="text-4xl font-bold bg-green-100 p-4 rounded w-full text-center min-h-[3rem] mb-4">
          {score}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!roundHeatId || !runNum || !score || eventIsFinished}
          className="btn bg-orange-600 text-white w-full disabled:opacity-50"
        >
          {eventIsFinished ? "Event Finished" : "SUBMIT"}
        </button>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => !eventIsFinished && handleClick(key)}
              className={`btn text-lg ${
                key === "CLEAR" ? "col-span-2 bg-yellow-400" : "bg-yellow-300"
              } ${eventIsFinished ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={eventIsFinished}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1/2 p-4 space-y-4 ">
        {/* Athlete List */}
        <div className="w-full">
          <div className="grid grid-cols-6 gap-1 text-sm font-semibold text-center mb-2">
            <div>BIB</div>
            {athletes.length > 0 &&
              athletes[0].runs.map((run) => (
                <div key={run.run_num}>Run {run.run_num}</div>
              ))}
          </div>

          {athletes.map(({ athlete_id, bib, runs }) => (
            <div
              key={athlete_id}
              className="grid grid-cols-6 gap-1 text-center mb-1"
            >
              <div className="bg-gray-100 p-1">{bib}</div>
              {runs.map(({ run_num, round_heat_id }) => {
                const key = `${athlete_id}-${run_num}`;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      console.log(
                        `Selected athlete: ${bib}, run: ${run_num}, round_heat_id: ${round_heat_id}`
                      );
                      setRoundHeatId(round_heat_id);
                      setRunNum(run_num);
                      setSelected({ bib, run: run_num, athlete_id });
                    }}
                    className="bg-gray-200 p-1 hover:bg-gray-300 "
                  >
                    {submittedScores[key] ?? "+"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
