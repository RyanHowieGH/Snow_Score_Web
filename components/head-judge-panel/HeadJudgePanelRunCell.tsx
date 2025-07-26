'use client'
import React from 'react';
import { useState, useEffect, FormEvent } from 'react';
import Modal from '@/components/PopUpModal';
import {Info} from 'lucide-react';
import type { RunCell } from '@/lib/definitions';

type RunCellProps = {
    run_result_id: number,
    scorePerRun: RunCell,
    run_num: number,
}

export default function RunCell ( props : RunCellProps ) {

    // const [scores, setScores] = useState<RunCell>();
    const [average, setAverage] = useState<number>();
    const [openCheckScores, setOpenCheckScores] = useState<boolean>(false);
    const [modifier, setModifier] = useState<string>();


    /* It would be good to have this with useState if we would allow the head judge to change
       the scores for the judges. Now that I am thinking... if we just shoot the update to the
       database, it would repass everything as props anyway, so it would be re-rendering this
       component...
    */

    // useEffect (()=> {
    //     setScores(props.scorePerRun);
    // },[props])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        try{
            // implement regex (prevent SQL injection here or any undesired thing)

            // API for later implementation DNI/S/F
            // const response = await fetch("API");
                // console.log("...");
                // toast.success(`...`);
        } catch (error) {
            // console.error('...', error);
            // toast.error(`...`); 
        }
        finally{

        }
    };

    return(
        <div>
            <button
            className='w-full'
            onClick={() => setOpenCheckScores(true)}>
                <div className="flex flex-col items-center">
                    {/* average */}
                    <div className="w-full text-2xl font-bold text-center pb-1">
                        {props.scorePerRun.run_average != null ? props.scorePerRun.run_average : '-'}
                    </div>

                    {/* individual judge scores */}
                    <div className="w-full space-y-1 pt-1">
                        {props.scorePerRun?.judgesScore.map((judgeScore) => (
                        <div
                            key={judgeScore[props.run_num].personnel_id}
                            className="text-sm text-center"
                        >
                            {judgeScore[props.run_num].score != null ? judgeScore[props.run_num].score : '-'}
                        </div>
                        ))}
                    </div>
                </div>

            </button>

                {/* CHECK SCORES WITH JUDGES DATA */}
                    <Modal open={openCheckScores} onClose={() => {
                        setOpenCheckScores(false);
                        }}>
                        <div
                        className='w-[300px]'>
                            <form onSubmit={(e) => handleSubmit(e)}>
                                <div>      
                                    {/* <div className="relative ml-2 group inline-block w-70">
                                        <Info className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-context-menu" />
                                        <div
                                            className={`
                                            invisible group-hover:visible 
                                            opacity-0 group-hover:opacity-100 
                                            transition-all duration-150
                                            absolute left-full top-1/2
                                            ml-2 w-[2000%]
                                            -translate-y-1/2
                                            bg-gray-800 text-white text-sm 
                                            rounded p-3 shadow
                                            `}
                                        >
                                        blob blob blob blob blob blob blob blob blob blob blob blob blob blob blob blob blob blob .
                                        </div>
                                    </div> */}

                                    <div className="flex flex-col">
                                        <h1
                                        className='text text-2xl font-bold mb-5'>Edit Run {props.scorePerRun?.run_num}</h1>
                                        <h2
                                        className='text-2xl mb-5'>Athlete: {props.scorePerRun?.athlete_name} {`(BIB #`}{props.scorePerRun?.bib_num}{`)`}</h2>
                                        {/* average */}
                                        <div className="w-full border-b border-black text-xl font-semibold pb-1">
                                            Average: {props.scorePerRun.run_average != null ? props.scorePerRun.run_average : '-'}
                                        </div>

                                        {/* individual judge scores */}
                                        <div className="">
                                            {props.scorePerRun?.judgesScore.map((judgeScore) => (
                                            <div
                                                key={judgeScore[props.run_num].personnel_id}
                                                className="grid grid-cols-2"
                                            >
                                                <span>
                                                    {judgeScore[props.run_num].name != "" 
                                                    ? judgeScore[props.run_num].name :
                                                    judgeScore[props.run_num].header }
                                                </span>
                                                <span>
                                                    {judgeScore[props.run_num].score != null ? judgeScore[props.run_num].score : '-'}
                                                </span>
                                            </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div
                                className='flex mt-10'>
                                    <button
                                    type="submit"
                                    className="block mx-auto w-25 px-4 py-2 bg-black text-white rounded disabled:opacity-50 mt-5"
                                    >
                                    Submit
                                    </button>
                                    <button
                                    type="submit"
                                    className="block mx-auto w-25 px-4 py-2 bg-white text-black border-1 rounded disabled:opacity-50 mt-5"
                                    >
                                    Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                    </Modal>
        </div>
   
    )
}