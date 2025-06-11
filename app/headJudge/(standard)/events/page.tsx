"use client";

import { useEffect, useState } from "react";

//This is just for testing purposes, to be removed later or replaced
interface RunResult {
  run_result_id: number;
  round_heat_id: number;
  event_id: number;
  division_id: number;
  athlete_id: number;
  run_num: number;
  calc_score: number;
}

export default function EventsPage() {
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRunResults = async () => {
      try {
        const response = await fetch("/api/personnel");
        if (!response.ok) throw new Error("Failed to fetch run results");

        const data = await response.json();
        console.log("Fetched run results:", data);
        setRunResults(data);
      } catch (err) {
        console.error("Error fetching run results:", err);
        setError("Failed to load run results");
      } finally {
        setLoading(false);
      }
    };

    fetchRunResults();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Run Results</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Run Result ID</th>
            <th className="border p-2">Round Heat ID</th>
            <th className="border p-2">Event ID</th>
            <th className="border p-2">Division ID</th>
            <th className="border p-2">Athlete ID</th>
            <th className="border p-2">Run #</th>
            <th className="border p-2">Calc Score</th>
          </tr>
        </thead>
        <tbody>
          {runResults.map((result) => (
            <tr key={result.run_result_id} className="text-center">
              <td className="border p-2">{result.run_result_id}</td>
              <td className="border p-2">{result.round_heat_id}</td>
              <td className="border p-2">{result.event_id}</td>
              <td className="border p-2">{result.division_id}</td>
              <td className="border p-2">{result.athlete_id}</td>
              <td className="border p-2">{result.run_num}</td>
              <td className="border p-2">{result.calc_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
