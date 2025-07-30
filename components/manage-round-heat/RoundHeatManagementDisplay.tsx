"use client"
import React, { useState, useEffect, useRef } from "react";
import type { RoundManagement, HeatManagement } from "@/lib/definitions";
import toast from "react-hot-toast";

export type RoundHeatManagementDisplayProps = {
  rounds: RoundManagement[];
};

export default function RoundHeatManagementDisplay(props: RoundHeatManagementDisplayProps) {
  const [roundArray, setRoundArray] = useState<RoundManagement[]>(() => props.rounds.map(r => ({ ...r })));
  const isAddingRound = useRef(false);

  useEffect(() => {
    setRoundArray(props.rounds.map(r => ({ ...r })));
  }, [props.rounds]);

  const eventId = roundArray[0]?.event_id ?? 0;
  const divisionId = roundArray[0]?.division_id ?? 0;

  function updateRound(index: number, newFields: Partial<RoundManagement>) {
    setRoundArray((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...newFields };
      return copy;
    });
  }

  function updateHeat(roundIndex: number, heatIndex: number, newFields: Partial<HeatManagement>) {
    setRoundArray((prev) => {
      const copy = [...prev];
      const heats = copy[roundIndex].heats ?? [];
      const updated = [...heats];
      updated[heatIndex] = { ...updated[heatIndex], ...newFields };
      copy[roundIndex] = { ...copy[roundIndex], heats: updated };
      return copy;
    });
  }

  function addRound() {
    if (isAddingRound.current) return;
    isAddingRound.current = true;

    try {
      const tempId = -(Date.now()); // Unique negative ID for the key

      const roundOrder = roundArray.length + 1;
      const newRound: RoundManagement = {
        event_id: eventId,
        division_id: divisionId,
        round_id: tempId, // Use the temporary ID
        round_num: roundOrder,
        round_name: "NEW ROUND",
        num_heats: 1,
        round_sequence: roundOrder,
        heats: [{ heat_num: 1, num_runs: 3, schedule_sequence: 1 }],
      };
      
      setRoundArray((prev) => [...prev, newRound]);
      
    } catch (err) {
      console.error("Error adding new round:", err);
      toast.error("Failed to add a new round.");
    } finally {
      isAddingRound.current = false;
    }
  }

  async function handleSave() {
    const roundsToSave = roundArray.map((round, index) => ({
      ...round,
      // If round_id is negative, it's a new round. The server will see null and INSERT.
      round_id: (round.round_id && round.round_id > 0) ? round.round_id : null,
      round_sequence: index + 1,
      round_num: index + 1,
    }));

    try {
      const res = await fetch("/api/add-update-rounds-and-heats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roundsToSave),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Save failed');
      }
      toast.success("Rounds & heats saved successfully");
      // Consider a page refresh or re-fetch here to get the new, real IDs from the server
      // router.refresh(); // if using Next.js App Router navigation
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error saving rounds & heats");
    }
  }

  return (
    <div>
      <div className="space-y-6">
        {roundArray.map((round, roundIndex) => (
          // --- VVV THIS IS THE FIX VVV ---
          // The key prop must be a unique string or number.
          // We can use the temporary negative ID for new rounds.
          <div key={round.round_id} className="p-4 border rounded shadow-sm">
          {/* --- ^^^ END OF FIX ^^^ --- */}

            <h3 className="text-lg font-semibold mb-2">{round.round_name} Round</h3>
            <div className="mb-2">
              <label className="mr-2">Name:</label>
              <input type="text" value={round.round_name} onChange={(e) => updateRound(roundIndex, { round_name: e.target.value })} className="border px-2 py-1 rounded"/>
            </div>
            <div className="mb-5 mt-5">
              <label className="mr-1">Number of Heats:</label>
              <select
                value={round.num_heats}
                onChange={(e) => {
                  const nh = parseInt(e.target.value, 10);
                  const heats = round.heats ?? [];
                  const updatedHeats = [...heats];
                  
                  while (updatedHeats.length < nh) {
                    updatedHeats.push({
                      heat_num: updatedHeats.length + 1,
                      num_runs: 3,
                      schedule_sequence: updatedHeats.length + 1,
                    });
                  }
                  if (updatedHeats.length > nh) {
                    updatedHeats.length = nh;
                  }
                  
                  updateRound(roundIndex, { num_heats: nh, heats: updatedHeats });
                }}
                className="border px-1 py-1 rounded">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>

            {round.heats?.map((heat, heatIndex) => (
              <div key={heatIndex} className="ml-4 pl-4 border-l-2 mb-4">
                <span className="font-medium">Heat {heatIndex + 1}:</span>
                <div className="mt-2">
                  <label className="flex items-center">
                    Number of Runs: 
                    <select
                      value={heat.num_runs}
                      onChange={(e) => updateHeat(roundIndex, heatIndex, { num_runs: parseInt(e.target.value, 10) })}
                      className="border rounded ml-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <button className="btn btn-secondary" onClick={addRound}>
          + Add Round
        </button>
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={handleSave} className="btn btn-primary">
          Update All
        </button>
      </div>
    </div>
  );
}