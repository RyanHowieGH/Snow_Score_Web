"use client";

import { useEffect, useState } from "react";

type AthleteRun = {
  athlete_id: number;
  bib: number;
  round_heat_id: number;
  runs: number[];
};

export default function ScoreInput() {
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
  const [selected, setSelected] = useState<{ bib: number; run: number } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/athletes")
      .then((res) => res.json())
      .then((data) => {
        const cleanData = data.filter(
          (a: { bib: null | undefined }) =>
            a.bib !== null && a.bib !== undefined
        );
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

  //Make personnel_id dynamic
  // For now, hardcoded to 1
  const handleSubmit = async () => {
    const personnel_id = 123;

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

  return (
    <div className="flex flex-row-reverse width-full h-screen ">
      <div className=" flex-1/2 p-4 space-y-1">
        {/* Score Display */}
        <div className="text-lg font-semibold bg-green-100 rounded p-2 text-center">
          {selected?.bib}
        </div>
        <div className="text-4xl font-bold bg-green-100 p-4 rounded w-full text-center min-h-[3rem] mb-4">
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

      <div className="flex-1/2 p-4 space-y-4 ">   
        {/* Athlete List */}
        <div className="w-full">
          <div className="grid grid-cols-6 gap-1 text-sm font-semibold text-center mb-2">
            <div>BIB</div>
            {athletes.length > 0 && athletes[0].runs.map((runNum) => (
              <div key={runNum}>Run {runNum}</div>
            ))}
          </div>

          {athletes.map(({ bib, round_heat_id: rhid, runs }) => (
            <div key={bib} className="grid grid-cols-6 gap-1 text-center mb-1">
              <div className="bg-gray-100 p-1">{bib}</div>
              {runs.map((rNum) => {
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
      </div>      
    </div>
  );
}
