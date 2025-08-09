"use client"
import React, { useState, useEffect, useRef } from "react";
import type { RoundManagement, HeatManagement } from "@/lib/definitions";
import toast from "react-hot-toast";

export type RoundHeatManagementDisplayProps = {
  rounds: RoundManagement[];
};

export default function RoundHeatManagementDisplay(
  props: RoundHeatManagementDisplayProps
) {
  const [roundArray, setRoundArray] = useState<RoundManagement[]>(
    () => props.rounds.map((r) => ({ ...r }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalRounds, setOriginalRounds] = useState<
    Record<number, RoundManagement>
  >({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});
  const isAddingRound = useRef(false);

  useEffect(() => {
    setRoundArray(props.rounds.map((r) => ({ ...r })));
    setEditingIndex(null);
    setOriginalRounds({});
    setDirtyMap({});
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
    setDirtyMap((prev) => ({ ...prev, [index]: true }));
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
    setDirtyMap((prev) => ({ ...prev, [roundIndex]: true }));
  }

  function beginEdit(index: number) {
    setOriginalRounds((prev) => ({
      ...prev,
      [index]: { ...roundArray[index] },
    }));
    setEditingIndex(index);
  }

  function cancelEdit(index: number) {
    setRoundArray((prev) => {
      const copy = [...prev];
      copy[index] = originalRounds[index];
      return copy;
    });
    setOriginalRounds((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
    setDirtyMap((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
    setEditingIndex(null);
  }

  async function addRound() {
    if (isAddingRound.current) return;
    // If another round is being edited, save it before adding
    if (editingIndex !== null) {
      try {
        await saveRound(editingIndex);
      } catch {
        // If saving fails, do not proceed with adding a new round
        return;
      }
    }

    isAddingRound.current = true;

    try {
      const tempId = -Date.now();
      const roundOrder = roundArray.length + 1;
      const newRound: RoundManagement = {
        event_id: eventId,
        division_id: divisionId,
        round_id: tempId,
        round_num: roundOrder,
        round_name: "NEW",
        num_heats: 1,
        round_sequence: roundOrder,
        num_athletes: 0,
        heats: [{ heat_num: 1, num_runs: 3, schedule_sequence: 1 }],
      };

      setRoundArray((prev) => [...prev, newRound]);
      setEditingIndex(roundArray.length);
      setOriginalRounds((prev) => ({
        ...prev,
        [roundArray.length]: { ...newRound },
      }));
      setDirtyMap((prev) => ({ ...prev, [roundArray.length]: true }));
    } catch (err) {
      console.error("Error adding new round:", err);
      toast.error("Failed to add a new round.");
    } finally {
      isAddingRound.current = false;
    }
  }

  async function progressRound(roundId: number | null) {
    try {
      const res = await fetch(`/api/make-round-progress?source_round_id=${roundId}`);
      if (!res.ok) throw new Error("Failed to make round progress");
      toast.success("Round progressed");
    } catch (err) {
      console.error(err);
      toast.error("Unable to progress round");
    }
  }

  async function deleteRound(index: number) {
    const round = roundArray[index];
    try {
        const res = await fetch(`/api/delete-round?round_id=${round.round_id}`, {
          method: "DELETE"})
        if (!res.ok) throw new Error("Failed to delete round");
      

      const updated = roundArray
        .filter((_, i) => i !== index)
        .map((r, i) => ({
          ...r,
          round_num: i + 1,
          round_sequence: i + 1,
        }));
      setRoundArray(updated);
      setEditingIndex(null);
      setDirtyMap({});
      setOriginalRounds({});

      // Persist updated ordering
      const payload = updated.map((r, i) => ({
        ...r,
        round_num: i + 1,
        round_sequence: i + 1,
      }));
      if (payload.length > 0) {
        const saveRes = await fetch("/api/add-update-rounds-and-heats", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!saveRes.ok) throw new Error("Failed to update round order");
      }
      toast.success("Round deleted");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error deleting round");
    }
  }

  async function saveRound(index: number) {
    const r = roundArray[index];
    const payload = [
      {
        ...r,
        round_sequence: index + 1,
        round_num: index + 1,
      },
    ];
    try {
      const res = await fetch("/api/add-update-rounds-and-heats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save round");
      const { idMap } = await res.json();
      if (Array.isArray(idMap)) {
        const mapEntry = idMap.find((m: any) => m.tempId === r.round_id);
        if (mapEntry) {
          setRoundArray((prev) =>
            prev.map((x, i) =>
              i === index ? { ...x, round_id: mapEntry.realId } : x
            )
          );
        }
      }
      toast.success("Round saved!");
      setDirtyMap((prev) => ({ ...prev, [index]: false }));
      setOriginalRounds((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
      setEditingIndex(null);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error saving round");
    }
  }

  return (
    <div>
      <div className="space-y-6">
        {roundArray.map((round, roundIndex) => {
          const isEditing = editingIndex === roundIndex;
          const isDirty = !!dirtyMap[roundIndex];
          const nextRoundNum = round.round_num - 1;
          let progressionText = "";
          if (nextRoundNum === 0) progressionText = "Final round";
          else {
            const next = roundArray.find(
              (r) => r.round_num === nextRoundNum
            );
            if (next)
              progressionText = `This round progresses to the ${next.round_name} round.`;
          }

          return (
            <div
              key={round.round_id}
              className="p-4 border rounded shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                   Round: {round.round_name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    className={
                      isEditing
                        ? "btn btn-sm btn-error"
                        : "btn btn-sm btn-outline btn-primary"
                    }
                    onClick={() =>
                      isEditing
                        ? cancelEdit(roundIndex)
                        : beginEdit(roundIndex)
                    }
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                  {isEditing ? (
                    <button
                      className="btn btn-sm btn-success"
                      disabled={!isDirty}
                      onClick={() => saveRound(roundIndex)}
                    >
                      Save
                    </button>
                  ) : (
                    <>
                    {round.round_num == 1 ? 
                    <></>
                    :                      
                    <button
                      className="btn btn-sm btn-secondary"
                      disabled={round.round_num == 1}
                      onClick={() => progressRound(round.round_id)}>
                      Progress
                    </button>
                    }

                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => deleteRound(roundIndex)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="mb-2 mt-2">
                    <label className="mr-2 font-bold">Name:</label>
                    <input
                      type="text"
                      value={round.round_name}
                      onChange={(e) =>
                        updateRound(roundIndex, {
                          round_name: e.target.value,
                        })
                      }
                      className="border px-2 py-1 rounded"
                    />
                  </div>

                  <div className="mb-4 mt-2">
                    <label className="mr-2 font-bold">
                      Number of Heats:
                    </label>
                    <select
                      value={round.num_heats}
                      onChange={(e) => {
                        const numHeats = parseInt(e.target.value, 10);
                        const heats = round.heats ?? [];
                        const updated = [...heats];
                        while (updated.length < numHeats)
                          updated.push({
                            heat_num: updated.length + 1,
                            num_runs: 3,
                            schedule_sequence:
                              updated.length + 1,
                          });
                        updated.length = numHeats;
                        updateRound(roundIndex, {
                          num_heats: numHeats,
                          heats: updated,
                        });
                      }}
                      className="border px-1 py-1 rounded"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {round.heats?.map((heat, heatIndex) => (
                    <div
                      key={heatIndex}
                      className="mb-2 pl-4 border-l-2"
                    >
                      <div className="font-bold">
                        Heat {heatIndex + 1}:
                      </div>
                      <label className="flex items-center mt-1">
                        <span className="font-bold">Runs:</span>
                        <select
                          value={heat.num_runs}
                          onChange={(e) =>
                            updateHeat(roundIndex, heatIndex, {
                              num_runs: parseInt(e.target.value, 10),
                            })
                          }
                          className="border rounded ml-2 px-1 py-1"
                        >
                          {Array.from(
                            { length: 10 },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}

                  {round.round_num !== 1 && (
                    <div className="mt-2">
                      <label className="flex items-center">
                        <span className="font-bold">
                          Athletes to progress:
                        </span>
                        <input
                          type="number"
                          value={round.num_athletes}
                          min = {0}
                          onChange={(e) =>
                            updateRound(roundIndex, {
                              num_athletes: parseInt(
                                e.target.value,
                                10
                              ),
                            })
                          }
                          className="border rounded ml-2 px-2 py-1 w-16 text-center"
                        />
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <p>
                    <strong>Name:</strong> {round.round_name}
                  </p>
                  <p>
                    <strong>Number of Heats:</strong>{" "}
                    {round.num_heats}
                  </p>
                  {round.heats?.map((heat, i) => (
                    <p key={i} className="pl-4">
                      <strong>Heat {i + 1}:</strong> {heat.num_runs} runs
                    </p>
                  ))}
                  {round.round_num !== 1 && (
                    <p>
                      <strong>Athletes to progress:</strong>{" "}
                      {round.num_athletes}
                    </p>
                  )}
                </div>
              )}

              {progressionText && (
                <div className="text-sm italic mt-2">
                  {progressionText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-4">
        <button className="btn btn-secondary" onClick={addRound}>
          ADD ROUND
        </button>
      </div>
    </div>
  );
}

