import React from 'react';
import RunCell from '@/components/HeadJudgePanelRunCell'

export default function TestPage() {

    return(
        <div>
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
        }
        />
        </div>

    );
}