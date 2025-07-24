'use client'
import React from 'react';
import { useState, useEffect, FormEvent } from 'react';
import Modal from '@/components/PopUpModal';
import {Info} from 'lucide-react';
import type { RunCell } from '@/lib/definitions';


export default function RunCell (run_result_id: number, scorePerRun: RunCell) {

    const [scores, setScores] = useState<RunCell>();
    const [average, setAverage] = useState<number>();
    const [openCheckScores, setOpenCheckScores] = useState<boolean>(false);
    const [modifier, setModifier] = useState<string>();

    useEffect (()=> {
        setScores(scorePerRun);
    },[])

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
                                        className='text text-2xl font-bold mb-5'>Edit Run {scores?.run_num}</h1>
                                        <h2
                                        className='text-2xl mb-5'>Athlete: {scores?.athlete_name} {`(BIB #`}{scores?.bib_num}{`)`}</h2>
                                        {/* average */}
                                        <div className="w-full border-b border-black text-xl font-semibold pb-1">
                                            Average: {scorePerRun.run_average != null ? scorePerRun.run_average.toFixed(2) : '-'}
                                        </div>

                                        {/* individual judge scores */}
                                        <div className="">
                                            {scores?.judgesScore.map((judgeScore) => (
                                            <div
                                                key={judgeScore.personnel_id}
                                                className="grid grid-cols-2"
                                            >
                                                <span>
                                                    {judgeScore.name ?? judgeScore.header}
                                                </span>
                                                <span>
                                                    {judgeScore.score != null ? judgeScore.score.toFixed(1) : '-'}
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