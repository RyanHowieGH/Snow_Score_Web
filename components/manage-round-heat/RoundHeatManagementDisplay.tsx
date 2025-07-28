"use client"
import React, { useState, useEffect } from "react";
import { roundSLL } from "./roundSLL";
import type { RoundManagement, HeatManagement } from "@/lib/definitions";
import toast from "react-hot-toast";
import next from "next";

export type RoundHeatManagementDisplayProps = {
  rounds: RoundManagement[];
};

export default function RoundHeatManagementDisplay(
  props: RoundHeatManagementDisplayProps
) {

    const [roundArray, setRoundArray] = useState<RoundManagement[]>(
    () => props.rounds.map(r => ({ ...r }))
  );

  const [roundList, setRoundList] = useState<roundSLL<RoundManagement>>(() => {
    const SLL = new roundSLL<RoundManagement>();
    props.rounds.forEach((round) => SLL.addLast({ ...round }));
    return SLL;
  });
  useEffect(() => {
    setRoundArray(props.rounds.map(r => ({ ...r })));
  }, [props.rounds]);

  const eventId = roundArray[0]?.event_id ?? 0;
  const divisionId = roundArray[0]?.division_id ?? 0;

  function updateRound(
    index: number,
    newFields: Partial<RoundManagement>
  ) {
    setRoundArray((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...newFields };
      return copy;
    });
  }

  function updateHeat(
    roundIndex: number,
    heatIndex: number,
    newFields: Partial<HeatManagement>
  ) {
    setRoundArray((prev) => {
      const copy = [...prev];
      const heats = copy[roundIndex].heats ?? [];
      const updated = [...heats];
      updated[heatIndex] = { ...updated[heatIndex], ...newFields };
      copy[roundIndex] = { ...copy[roundIndex], heats: updated };
      return copy;
    });
  }

  const [nextAvailableRoundId, setNextAvailableRoundId] = useState<number>();

  function addRound() {
    // ROUND ID FROM MAX: it should straight up write a row with that round_id, and 
    // delete/rollback if it fails => to prevent using the same if there are people 
    // using it at the same time
    fetch(`/api/get-max-round_id-from-event?event_id=${eventId}&division_id=${divisionId}`)
    .then((res) => res.json() as Promise<number>)
      .then((data) => setNextAvailableRoundId(data))
      .catch((err) => {
        toast.error("Failed to retrieve the next division identification available for assignment.");
      });
      console.log(`next available round ${nextAvailableRoundId}`);

    const roundOrder = roundArray.length + 1;
    const newRound: RoundManagement = {
      event_id: eventId,
      division_id: divisionId,
      round_id: nextAvailableRoundId ?? null,
      round_num: roundOrder,
      round_name: "NEW",
      num_heats: 1,
      round_sequence: roundOrder,
      heats: [
        {
          heat_num: 1,
          num_runs: 1,
          schedule_sequence: 1,
        },
      ],
    };
    setRoundArray((prev) => [...prev, newRound]);
    const SLL = roundList;
    SLL.addLast({ ...newRound });
    setRoundList(SLL);
  }


  async function handleSave() {
    const roundsToSave = roundArray.map((round, index) => ({
      ...round,
      round_sequence: index + 1,
      round_num: index + 1,
    }));

    try {
      const res = await fetch(
        "/api/add-update-rounds-and-heats",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roundsToSave),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      toast.success("Rounds & heats saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error saving rounds & heats");
    }
  }



  return (
    <div>



      <div className="space-y-6">
        {roundArray.map((round, roundIndex) => (
          <div
            key={round.round_id}
            className="p-4 border rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-2">
              {round.round_name} Round
            </h3>


            {/* Round name */}
            <div className="mb-2">
            <label className="mr-2">Name:</label>
            <input
                type="text"
                value={round.round_name}
                onChange={(e) =>
                updateRound(roundIndex, { round_name: e.target.value })
                }
                className="border px-2 py-1 rounded"/>
            </div>

            {/* Number of Heats */}
            <div className="mb-5 mt-5">
            <label className="mr-1">
                Number of Heats:
            </label>
            <select
                value={round.num_heats}
                onChange={(e) => {
                const nh = parseInt(e.target.value, 10);
                updateRound(roundIndex, { num_heats: nh });
                const heats = round.heats ?? [];
                const updated = [...heats];
                while (updated.length < nh) {
                    updated.push({
                    heat_num: updated.length + 2,
                    num_runs: 2,
                    schedule_sequence: updated.length + 2,
                    });
                }
                if (updated.length > nh) updated.length = nh;
                updateRound(roundIndex, { heats: updated });
                }}
                className="border px-1 py-1 rounded">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
                ))}
            </select>
            </div>

            {/* Number of Runs */}
            {round.heats?.map((heat, heatIndex) => (
            <div key={heatIndex} className="mb0  items-center space-x-2">
                <span className="font-medium">
                    Heat {heatIndex + 1}:
                </span>
                <div className="mb-5">
                    <label className="flex items-center space-x0">
                    Number of Runs: 
                        <select
                            value={heat.num_runs}
                            onChange={(e) =>
                            updateHeat(roundIndex, heatIndex, {
                                num_runs: parseInt(e.target.value, 10),
                            })
                            }
                            className="border rounded ml-2">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>
            ))}
          </div>
        ))}
      </div>

        <div className="flex justify-center mt-[1%]">
            <button
            className="mb-4 px-3 py-1 bg-green-600 text-white rounded"
            onClick={addRound}>
            + Add Round
            </button>
        </div>

        <div className="flex justify-end">
            <button
                onClick={handleSave}
                className="mt-6 px-4 py-2 bg-gray-600 text-white rounded"
            >
                UPDATE
            </button>
        </div>
    </div>
  );
}
