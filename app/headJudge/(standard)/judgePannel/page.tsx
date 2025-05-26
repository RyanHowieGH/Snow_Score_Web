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

  const handleClick = (value: string) => {
    if (value === "CLEAR") {
      setScore("");
    } else {
      setScore((prev) => (prev + value).slice(0, 3));
    }
  };

  const handleSubmit = () => {
    // Submit the score - currently just logs it
    console.log("Submitted score:", score);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-xs mx-auto">
      <div className="text-4xl font-bold bg-green-100 p-4 rounded w-full text-center min-h-[3rem]">
        {score}
      </div>

      <button
        onClick={handleSubmit}
        className="btn bg-orange-600 text-white w-full"
      >
        SUBMIT
      </button>

      <div className="grid grid-cols-3 gap-2 w-full">
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
