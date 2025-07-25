"use client"
import React from "react";
import type { CompetitionHJData } from "@/lib/definitions";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import RefreshSwitchButton from "@/components/RefreshSwitchButton";

type PageProps = {
    event_id: number,
}

export default function HeadJudgePanelCoreLive ({ event_id }: PageProps) {
    const [competitionData, setCompetitionData] = useState<CompetitionHJData>();

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

    useEffect(()=> {
        fetch(`/api/get-division-round-heat?event_id=${event_id}`)
        .then(async (res) => {
            return (await res.json()) as CompetitionHJData;
        })
        .then((res: CompetitionHJData) => {
            setCompetitionData(res);
        })
        .catch(err => {
            console.error("Failed to load competition data.", err);
            notFound();
        });
    },[refreshPageFlag])

    return(
        <div>
            
        </div>
    )
}