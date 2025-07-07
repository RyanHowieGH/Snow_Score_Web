'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type JudgingPanelClientProps = {
  judgingPanelPasscode: string;
  eventId: number;
  divisionId: number;
  roundId: number;
  roundHeatId: number;
  personnelId: number;
};

type AthleteRun = {
  athlete_id: number;
  bib: number;
  runs: {
    run_num: number;
    round_heat_id: number;
  }[];
}

export default function JudgingPanelClient({
  judgingPanelPasscode,
  eventId,
  divisionId,
  roundId,
  roundHeatId,
  personnelId,
}: JudgingPanelClientProps) {
  const [inputCode, setInputCode] = useState('');
  const [verified, setVerified] = useState(false);

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
  const [specificRoundHeatId, setSpecificRoundHeatId] = useState<number | null>(null);
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
    if (!eventId) return;

    fetch(`/api/athletes?event_id=${eventId}`)
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
  }, [eventId]);

  // PASSCODE VERIFICATION: START
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode === judgingPanelPasscode) {
      setVerified(true);
    } else {
      alert('Invalid passcode');
    }
  };

  if (!verified) {
    return (
      <form onSubmit={handlePasscodeSubmit} className="p-4 max-w-md mx-auto">
        <label className="block mb-2 text-lg font-semibold">
          Enter Passcode:
        </label>
        <input
          type="password"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          className="border px-3 py-2 w-full rounded"
        />
        <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
          Verify
        </button>
      </form>
    );
  }

  const handleClick = (value: string) => {
    if (value === "CLEAR") {
      setScore("");
    } else {
      setScore((prev) => (prev + value).slice(0, 3));
    }
  };

  //Make personnel_id dynamic
  // For now, hardcoded to 281
  const handleScoreSubmit = async () => {
    const personnel_id = 281; // Replace with actual personnel_id logic

    console.log("SUBMITTING:", {
      specificRoundHeatId,
      runNum,
      personnel_id,
      score,
    });

    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round_heat_id: specificRoundHeatId,
        run_num: runNum,
        personnel_id,
        score: parseFloat(score),
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
    if (!specificRoundHeatId || !runNum || !score) {
      alert("Please select an athlete and enter a score.");
      return;
    }
  };

  // JUDGE PANEL CREATION: END

  return (
    <div>
    <div className="ml-10">
      <h1 className="text-2xl font-bold mt-10 mb-5">
        Data required to make the panel unique:
      </h1>
      <div className="text-xl">
        <div>event_id: {eventId}</div>
        <div>division_id: {divisionId}</div>
        <div>round_id: {roundId}</div>
        <div>round_heat_id: {roundHeatId}</div>
        <div>personnel_id: {personnelId}</div>
      </div>
    </div>

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
          onClick={handleScoreSubmit}
          disabled={!specificRoundHeatId || !runNum || !score || eventIsFinished}
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
                      setSpecificRoundHeatId(round_heat_id);
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
    
    </div>
  )
}