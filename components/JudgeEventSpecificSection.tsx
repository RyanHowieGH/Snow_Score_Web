'use client';
import { EventDetails } from "@/lib/data";
import JudgeQRCode from "./JudgeQRCode";
import { useState, useEffect } from 'react';

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
        <div className="mb-6 flex flex-col md:flex-row md:justify-between gap-8 md:gap-12 border-white border-t-1 border-solid content-end border-white border-1">
            <div>
                <div
                className="flex ">
                    <div>
                        <h2 className="text-xl font-semibold mb-8 text-secondary mt-8 content-end border-white border-1">
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
                    <div className="">
                    {judges?.map((judge) => (
                        <div                           
                        key={judge.personnel_id}
                        className="flex border border-gray-30 p-4">
                        <div
                            className="text-1xl md:text-1xl mb-2 text-black text-center font-bold">
                            <ul>
                                <li>
                                    {judge.name == null ? judge.header : judge.name}
                                </li>
                            </ul>
                        </div>
                        <button
                        className="text-black"
                        >
                            Remove
                        </button>
                        </div>
                    ))}
                    </div>

                    
                }

            </div>
        </div>
    )
}                    

