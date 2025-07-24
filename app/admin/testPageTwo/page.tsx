import React from 'react';
import RunCell from '@/components/HeadJudgePanelRunCell';

interface Score {
  bib: number;
  athlete: string;
  seeding: number;
  run1?: number;
  run2?: number;
  best?: number;
  judgesScoreRun1?: any[];
  judgesScoreRun2?: any[];
  judgesScoreBest?: any[];
}

const scores: Score[] = [
  { bib: 86, athlete: 'Harry Coleman', seeding: 1, best: 0, judgesScoreBest: [] },
  { bib: 46, athlete: 'Eli Bouchard', seeding: 2, run1: 15.67, run2: 93.67, best: 93.67, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 47, athlete: 'Oliver Martin', seeding: 3, run1: 79, run2: 85, best: 85, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 43, athlete: 'Brooklyn DePriest', seeding: 4, run1: 60.5, run2: 70.67, best: 70.67, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 97, athlete: 'Maddox Matte', seeding: 5, run1: 23.67, run2: 69.33, best: 69.33, judgesScoreRun1: [], judgesScoreRun2: [], judgesScoreBest: [] },
  { bib: 66, athlete: 'Lys Fedorowycz', seeding: 6, run1: 69, best: 69, judgesScoreRun1: [], judgesScoreBest: [] },
  { bib: 74, athlete: 'Kobe Cantelon', seeding: 7, run1: 68.67, best: 68.67, judgesScoreRun1: [], judgesScoreBest: [] },
];

const JudgeScoresTable: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left font-medium">Bib</th>
            <th className="px-4 py-2 text-left font-medium">Seeding</th>
            <th className="px-4 py-2 text-left font-medium">Run 1</th>
            <th className="px-4 py-2 text-left font-medium">Run 2</th>
            <th className="px-4 py-2 text-left font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => (
            <tr key={score.bib} className="even:bg-white odd:bg-gray-50">
              <td className="px-4 py-2">{score.bib}</td>
              <td className="px-4 py-2">{score.seeding}</td>

              {/* Run 1 cell using HeadJudgePanelRunCell */}
              <td className="px-4 py-2">
                {score.run1 !== undefined ? (
                  <RunCell
                    athlete_name= {`Tim Smith`}
                    bib_num={2}
                    run_num= {1} 
                    run_result_id= { 123 }
                    run_average={ 40 }
                    judgesScore={
                        [{
                            personnel_id: 10,
                            header: 'Header',
                            name: 'Name',
                            score: 20,
                        }, 
                        {
                            personnel_id: 20,
                            header: 'Header2',
                            name: '',
                            score: 40,
                        }, 
                        ]
                    }/>
                ) : (
                  '—'
                )}
              </td>

              {/* Run 2 cell using HeadJudgePanelRunCell */}
              <td className="px-4 py-2">
                {score.run2 !== undefined ? (
                  <RunCell
                    athlete_name= {`Tim Smith`}
                    bib_num={2}
                    run_num= {1} 
                    run_result_id= { 123 }
                    run_average={ 40 }
                    judgesScore={
                        [{
                            personnel_id: 10,
                            header: 'Header',
                            name: 'Name',
                            score: 20,
                        }, 
                        {
                            personnel_id: 20,
                            header: 'Header2',
                            name: '',
                            score: 40,
                        }, 
                        ]
                    }/>
                ) : (
                  '—'
                )}
              </td>

              {/* Best cell using HeadJudgePanelRunCell */}
              <td className="px-4 py-2 font-semibold">
                {score.best !== undefined ? (
                  2
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
