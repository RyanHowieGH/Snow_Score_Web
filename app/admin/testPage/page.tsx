import React from 'react';
import RunCell from '@/components/HeadJudgePanelRunCell'

export default function TestPage() {

    return(
        <div>
        <RunCell
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