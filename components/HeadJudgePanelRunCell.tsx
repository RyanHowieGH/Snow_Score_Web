'use client'
import React from 'react';
import type { ScoresPerRunHJData } from '@/lib/definitions';
import { useState, useEffect } from 'react';

type RunCellProps = {
    run_average: number | null,
    judgesScore: JudgeScore[];
}    

type JudgeScore = {
    personnel_id: number;
    header: string;
    name: string;
    score: number | null;
}

export default function RunCell (scorePerRun: RunCellProps) {

    const [scores, setScores] = useState<RunCellProps>();
    const [average, setAverage] = useState<number>();

    useEffect (()=> {
        setScores(scorePerRun);
    },[])

    return(

    <div className="border border-black flex flex-col items-center">
      {/* average */}
      <div className="w-full border-b border-black text-xl font-bold text-center pb-1">
        {scorePerRun.run_average != null ? scorePerRun.run_average.toFixed(2) : '-'}
      </div>

      {/* individual judge scores */}
      <div className="w-full space-y-1 pt-1">
        {scores?.judgesScore.map((judgeScore) => (
          <div
            key={judgeScore.personnel_id}
            className="text-sm text-center"
          >
            {judgeScore.score != null ? judgeScore.score.toFixed(1) : '-'}
          </div>
        ))}
      </div>
    </div>
    )
}