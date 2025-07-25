"use client"
import React from "react";
import type { CompetitionHJData } from "@/lib/definitions";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import RefreshSwitchButton from "@/components/RefreshSwitchButton";

type PageProps = {
    event_id: number,
    round_heat_ids: number[],
}

export default function HeadJudgePanelCoreLive ({ event_id, round_heat_ids }: PageProps) {
    const [scoreData, setScoreData] = useState<CompetitionHJData>();

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

    let round_heat_ids_API = round_heat_ids.map(id => `round_heat_id=${id}`).join(`&`);
    
    useEffect(()=> {
        fetch(`/api/get-headjudge-scores?event_id=${event_id}&${round_heat_ids_API}`)
        .then(async (res) => {
            return (await res.json()) as CompetitionHJData;
        })
        .then((res: CompetitionHJData) => {
            setScoreData(res);
        })
        .catch(err => {
            console.error("Failed to load competition data.", err);
            notFound();
        });
    },[refreshPageFlag])

    return(
      <div className="flex min-h-screen flex-col border-1 border-black">
        {/* Top bar with button on the right */}
        <div className="flex justify-end p-4">
          <RefreshSwitchButton onLiveToggle={handleOnLiveToggle} />
        </div>
        <div>
            
        </div>
      </div>
    )
}