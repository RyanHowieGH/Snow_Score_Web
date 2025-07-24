"use client";
import HeatTable from "@/components/HeatTable";
import Standing from "@/components/Standings";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";
import RefreshSwitchButton from "@/components/RefreshSwitchButton";
import type { CompetitionHJData, DivisionHJData, RoundHJData, HeatHJData } from "@/lib/definitions";
// --- Head Judge Panel ---

export default function HeadJudgePanel () {
  const { eventId } = useParams();
  const parsedEventId = eventId ? parseInt(eventId as string, 10) : null;
  const [heats, setHeats] = useState<[]>([]);
  const [standings, setStandings] = useState<[]>([]);
  const [selectedDivisionId, setSeletectedDivisionId] = useState();
  const [selectedRoundId, setSeletectedRoundId] = useState();
  const [selectedHeatId, setSeletectedHeatId] = useState();

  // --- Data refresh ---
  const [refreshPageFlag, setRefreshPageFlag] = useState<boolean>(true);
  const [liveSwitch, setLiveSwitch] = useState<boolean>(false);

  const handleOnLiveToggle = () => {
    setLiveSwitch((prev) => !prev);
  };

  let refreshInterval: NodeJS.Timeout | null;

  useEffect(() => {
    if (liveSwitch) {
      refreshInterval = setInterval(() => {
        setRefreshPageFlag((prev) => !prev);
      }, 1000);
      console.log("Panel is online");
    }
    if (liveSwitch === false) {
      refreshInterval = null;
      console.log("Panel is offline");
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [liveSwitch]);

  // --- Get competition data ---
  useEffect(() => {
    if (!parsedEventId) return;



  }, [refreshPageFlag]);

  // --- Get latest scores ---
  useEffect(() => {
    if (!parsedEventId) return;



  }, [refreshPageFlag]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with button on the right */}
      <div className="flex justify-end p-4">
        <RefreshSwitchButton onLiveToggle={handleOnLiveToggle} />
      </div>
      {/* <div>
                <div>
                  <select
                    className="select select-bordered font-normal w-full text-black"
                    value={selectedDivisionId}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedDivisionId(id);
                      const hj = headJudges.find(h => String(h.user_id) === id);
                      if (hj?.first_name && hj?.last_name) {
                        setOnChangeHeadjudgeName(`${hj.first_name} ${hj.last_name}`);
                      }
                    }}          >
                    <option value="" disabled>
                      Select head judge
                    </option>
                    {headJudges.map(hj => (
                      <option key={hj.user_id} value={hj.user_id}>
                        {hj.first_name} {hj.last_name}
                      </option>
                    ))}
                  </select>
                </div> */}
</div>
  );
};