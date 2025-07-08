'use client';

import { useEffect, useState } from "react";
import Image from 'next/image';

type JudgingPanelClientProps = {
  judgingPanelPasscode: number;
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

type BestScore = {
  bib_num: number;
  best: number;
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
  const [selected, setSelected] = useState<{
    bib: number;
    run: number;
    athlete_id: number;
  } | null>(null);
  const [eventIsFinished, setEventIsFinished] = useState(false);
  const [submittedScores, setSubmittedScores] = useState<
    Record<string, number>
  >({});
  const [bestScores, setBestScores] = useState<BestScore[]>([]);

  useEffect(() => {
    if (!eventId) return;

    fetch(`/api/athletes?event_id=${eventId}&round_id=${roundId}&division_id=${divisionId}&round_heat_id=${roundHeatId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API athletes data:", data);
        setAthletes(data.athletes);
        setEventIsFinished(data.event.status === "COMPLETE");
      })
      .catch((err) => {
        console.error("Failed to load athletes or event or best scores", err);
        setAthletes([]);
      });
  }, [eventId, roundId, divisionId]);

  useEffect(() => {
    if (!roundHeatId) return;
    fetch(`/api/bestScoreTable?round_heat_id=${roundHeatId}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: BestScore[]) => setBestScores(data))
      .catch(err => {
        console.error("Failed to load best scores", err);
        setBestScores([]);
      });
  }, [roundHeatId]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, '');
    setInputCode(sanitized);
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedCode = inputCode.replace(/\D/g, '');

    if (sanitizedCode === String(judgingPanelPasscode)) {
      setVerified(true);
    } else {
      alert('Invalid access code');
      setInputCode('');
    }
  };

  if (!verified) {
    return (
    <div className=" min-h-screen flex flex-col justify-center py-12 px-4">
      <div className="max-w-xl w-full mx-auto bg-white border border-gray-200 rounded-lg shadow-md">
        <div className="p-8 flex flex-col items-center">
          <Image
            src="/assets/goggles_borderless.png"
            alt="SnowScore Logo"
            width={240}
            height={240}
            className="mb-6"
            priority
          />

          <h1 className="text-3xl font-extrabold text-gray-800 mb-12">
            Judging Panel
          </h1>

          <form onSubmit={handlePasscodeSubmit} className="w-">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Validate access
            </label>

            <input
              type="password"
              value={inputCode}
              onChange={handleCodeChange}
              inputMode="numeric"
              pattern="\d*"
              className="block w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Access code"
            />

            <button
              type="submit"
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors duration-200"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

  const handleClearButtonClick = (value: string) => {
    if (value === "CLEAR") {
      setScore("");
    } else {
      setScore((prev) => (prev + value).slice(0, 3));
    }
  };

  const handleScoreSubmit = async () => {

    console.log("SUBMITTING:", {
      roundHeatId,
      runNum,
      personnelId,
      score,
    });

    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round_heat_id: roundHeatId,
        run_num: runNum,
        personnel_id: personnelId,
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
    if (!roundHeatId || !runNum || !score) {
      alert("Please select an athlete and enter a score.");
      return;
    }
  };


  return (
    <div>
      <div className="flex flex-row-reverse w-full h-screen">
        <div className="flex-1/2 p-4 space-y-4">
          {/* Best Scores List */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-1 text-sm font-semibold text-center mb-2">
              <div>BIB</div>
              <div>BEST</div>
            </div>
            {/* rows */}
            {bestScores.map(({ bib_num, best }) => (
              <div
                key={bib_num}
                className="grid grid-cols-2 gap-1 text-center mb-1"
              >
                <div className="bg-gray-100 p-1">{bib_num}</div>
                <div className="bg-green-100 p-1">{Number(best).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>

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
                onClick={() => !eventIsFinished && handleClearButtonClick(key)}
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
                  <div key={run.run_num}>RUN {run.run_num}</div>
                ))}
            </div>

            {athletes.map(({ athlete_id, bib, runs }) => (
              <div
                key={athlete_id}
                className="grid grid-cols-6 gap-1 text-center mb-1"
              >
                <div className="bg-gray-100 p-1">{bib}</div>
                {runs.map(({ run_num }) => {
                  const key = `${athlete_id}-${run_num}`;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        console.log(
                          `Selected athlete: ${bib}, run: ${run_num}`
                        );
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