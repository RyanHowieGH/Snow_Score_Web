'use client';
import { EventDetails } from "@/lib/data";
import JudgeQRCode from "./JudgeQRCode";
import { useState, useEffect } from 'react';
import { deleteJudgeFromEvent } from "@/lib/data";

// Judge Interface
export interface Judge {
    personnel_id: string;
    header: string;
    name: string;
    event_id: number;
}

// Judge Interface
export interface JudgesProps {
    judges: Judge[] | null;
}

export default function JudgeEventSpecificSection ({judges}: JudgesProps) {

    const [isEditionMode, setIsEditionMode] = useState(false);

    return(
        <div className="mb-6 flex flex-col md:flex-row md:justify-between gap-8 md:gap-12 border-t-1 border-solid content-end border-white border-1 w-full">
            <div 
            className="w-full">
                <div
                className="flex items-center justify-between w-full border-b border-black dark:border-white pb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-secondary">
                        Judges
                        </h2>
                    </div>

                    <div 
                        className="content-end border-white border-1"
                        >
                        <button
                            onClick={() => setIsEditionMode(!isEditionMode)}>
                            Manage Judges
                        </button>
                    </div>

                </div>
                
                {
                    isEditionMode
                    ?
                    <div className="flex list-disc list-inside space-y-1 space-x-20">
                        {judges?.map((judge) => (
                            <div                           
                            key={judge.personnel_id}
                            className="border border-gray-300 bg-white p-4">
                            <div
                                className="text-2xl md:text-2xl mb-2 text-black text-center font-bold"
                            >
                            {judge.name == null ? judge.header : judge.name}
                            </div>
                            {JudgeQRCode(String(judge.event_id), judge.personnel_id)}
                    </div>
                    ))}
                    </div>
                    :
                    <div>
                        {judges?.map((judge) => (
                        <div
                            key={judge.personnel_id}
                            className="flex items-center justify-between py-2 border-b border-black dark:border-white"
            >
                            {/* Judge name/header */}
                            <div className="text-lg font-bold text-left text-black dark:text-white">
                            {judge.name ?? judge.header}
                            </div>

                            {/* Remove button */}
                            <button
                            onClick={() => deleteJudgeFromEvent(judge.event_id, judge.personnel_id)}
                            
                            className="text-red-597 hover:text-red-800"
                            >
                            REMOVE
                            </button>
                        </div>
                        ))}
                    </div>
                    
                }

            </div>
        </div>
    )
}                    

