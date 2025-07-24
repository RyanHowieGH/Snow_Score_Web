import React from 'react';
import HeadJudgePanelRunCell from '@/components/HeadJudgePanelRunCell';

interface Score {
  bib: number;
  athlete: string;
  rank: number;
  run1?: number;
  run2?: number;
  best?: number;
  // You can optionally add judgesScore arrays if you have them per run
  judgesScoreRun1?: any[];
  judgesScoreRun2?: any[];
  judgesScoreBest?: any[];
}

const scores: Score[] = [
  { bib: 86, athlete: 'Harry Coleman', rank: 1, best: 0, judgesScoreBest: [] },
  { bib: 46, athlete: 'Eli Bouchard', rank: 2, run1: 15.67, run2: 93.67, best: 93.67, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 47, athlete: 'Oliver Martin', rank: 3, run1: 79, run2: 85, best: 85, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 43, athlete: 'Brooklyn DePriest', rank: 4, run1: 60.5, run2: 70.67, best: 70.67, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 97, athlete: 'Maddox Matte', rank: 5, run1: 23.67, run2: 69.33, best: 69.33, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 66, athlete: 'Lys Fedorowycz', rank: 6, run1: 69, best: 69, judgesScoreRun1: [], judgesScoreBest: [] },
  { bib: 74, athlete: 'Kobe Cantelon', rank: 7, run1: 68.67, best: 68.67, judgesScoreRun1: [], judgesScoreBest: [] },
];

const JudgeScoresTable: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left font-medium">Bib</th>
            <th className="px-4 py-2 text-left font-medium">Athlete</th>
            <th className="px-4 py-2 text-left font-medium">Rank</th>
            <th className="px-4 py-2 text-left font-medium">Run 1</th>
            <th className="px-4 py-2 text-left font-medium">Run 2</th>
            <th className="px-4 py-2 text-left font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => (
            <tr key={score.bib} className="even:bg-white odd:bg-gray-50">
              <td className="px-4 py-2">{score.bib}</td>
              <td className="px-4 py-2">{score.athlete}</td>
              <td className="px-4 py-2">{score.rank}</td>

              {/* Run 1 cell using HeadJudgePanelRunCell */}
              <td className="px-4 py-2">
                {score.run1 !== undefined ? (
                  <HeadJudgePanelRunCell
                    run_result_id={score.bib * 100 + 1}
                    athlete_name={score.athlete}
                    bib_num={score.bib}
                    run_num={1}
                    run_average={score.run1!}
                    judgesScore={score.judgesScoreRun1 || []}
                  />
                ) : (
                  '—'
                )}
              </td>

              {/* Run 2 cell using HeadJudgePanelRunCell */}
              <td className="px-4 py-2">
                {score.run2 !== undefined ? (
                  <HeadJudgePanelRunCell
                    run_result_id={score.bib * 100 + 2}
                    athlete_name={score.athlete}
                    bib_num={score.bib}
                    run_num={2}
                    run_average={score.run2!}
                    judgesScore={score.judgesScoreRun2 || []}
                  />
                ) : (
                  '—'
                )}
              </td>

              {/* Best cell using HeadJudgePanelRunCell */}
              <td className="px-4 py-2 font-semibold">
                {score.best !== undefined ? (
                  <HeadJudgePanelRunCell
                    run_result_id={score.bib * 100 + 0}
                    athlete_name={score.athlete}
                    bib_num={score.bib}
                    run_num={0}
                    run_average={score.best!}
                    judgesScore={score.judgesScoreBest || []}
                  />
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JudgeScoresTable;
