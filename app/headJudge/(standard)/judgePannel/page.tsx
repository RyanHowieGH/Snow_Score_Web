"use client";

import { useState } from "react";

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

  const [score, setScore] = useState("");
  const [runNum, setRunNum] = useState<number | null>(null);
  const [roundHeatId, setRoundHeatId] = useState<number | null>(null);

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

      {/* Mock Athlete Run Grid */}
      <div className="w-full">
        <div className="grid grid-cols-6 gap-1 text-sm font-semibold text-center mb-2">
          <div>BIB</div>
          {[1, 2, 3, 4, 5].map((run) => (
            <div key={run}>Run {run}</div>
          ))}
        </div>

        {/* Replace with dynamic data from server 
        Also -> make sure that the bib number is being pulled as all of the roundheatId are selected when set to 1001*/}
        {[
          { bib: 24, roundHeatId: 9 },
          { bib: 31, roundHeatId: 10 },
          { bib: 38, roundHeatId: 11 },
        ].map(({ bib, roundHeatId: rhid }) => (
          <div key={bib} className="grid grid-cols-6 gap-1 text-center mb-1">
            <div className="bg-gray-100 p-1">{bib}</div>
            {[1, 2, 3, 4, 5].map((rNum) => (
              <button
                key={rNum}
                onClick={() => {
                  setRoundHeatId(rhid);
                  setRunNum(rNum);
                }}
                className={`p-1 border border-gray-300 hover:bg-blue-100 ${
                  roundHeatId === rhid && runNum === rNum
                    ? "bg-blue-300"
                    : "bg-white"
                }`}
              >
                +
              </button>
            ))}
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
