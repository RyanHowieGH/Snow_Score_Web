// 'use client';
// import { EventDetails } from "@/lib/data";
// import JudgeQRCode from "./JudgeQRCode";
// import { useState, useEffect } from 'react';
// import { deleteJudgeFromEvent } from "@/lib/data";

// // Judge Interface
// export interface Judge {
//     personnel_id: string;
//     header: string;
//     name: string;
//     event_id: number;
// }

// // Judge Interface
// export interface JudgesProps {
//     judges: Judge[] | null;
// }

// export default function JudgeEventSpecificSection ({judges}: JudgesProps) {

//     const [isEditionMode, setIsEditionMode] = useState(false);

//     return(
//         <div className="mb-6 flex flex-col md:flex-row md:justify-between gap-8 md:gap-12 border-t-1 border-solid content-end border-white border-1 w-full">
//             <div 
//             className="w-full">
//                 <div
//                 className="flex items-center justify-between w-full border-b border-black dark:border-white pb-4">
//                     <div>
//                         <h2 className="text-2xl font-semibold text-secondary">
//                         Judges
//                         </h2>
//                     </div>

//                     <div 
//                         className="content-end border-white border-1"
//                         >
//                         <button
//                             onClick={() => setIsEditionMode(!isEditionMode)}>
//                             Manage Judges
//                         </button>
//                     </div>

//                 </div>
                
//                 {
//                     isEditionMode
//                     ?
//                     <div className="flex list-disc list-inside space-y-1 space-x-20">
//                         {judges?.map((judge) => (
//                             <div                           
//                             key={judge.personnel_id}
//                             className="border border-gray-300 bg-white p-4">
//                             <div
//                                 className="text-2xl md:text-2xl mb-2 text-black text-center font-bold"
//                             >
//                             {judge.name == null ? judge.header : judge.name}
//                             </div>
//                             {JudgeQRCode(String(judge.event_id), judge.personnel_id)}
//                     </div>
//                     ))}
//                     </div>
//                     :
//                     <div>
//                         {judges?.map((judge) => (
//                         <div
//                             key={judge.personnel_id}
//                             className="flex items-center justify-between py-2 border-b border-black dark:border-white"
//             >
//                             {/* Judge name/header */}
//                             <div className="text-lg font-bold text-left text-black dark:text-white">
//                             {judge.name ?? judge.header}
//                             </div>

//                             {/* Remove button */}
//                             <button
//                             // onClick={() => deleteJudgeFromEvent(judge.event_id, judge.personnel_id)}
                            
//                             className="text-red-597 hover:text-red-800"
//                             >
//                             REMOVE
//                             </button>
//                         </div>
//                         ))}
//                     </div>
                    
//                 }

//             </div>
//         </div>
//     )
// }                    

'use client';
import { EventDetails } from "@/lib/data";
import JudgeQRCode from "./JudgeQRCode";
import { useState } from 'react';
import { deleteJudgeFromEvent } from "@/lib/data";

// Judge Interface
export interface Judge {
    personnel_id: string;
    header: string;
    name: string;
    event_id: number;
}

// JudgesProps Interface
export interface JudgesProps {
    judges: Judge[] | null;
}

export default function JudgeEventSpecificSection({ judges }: JudgesProps) {
    const [isEditionMode, setIsEditionMode] = useState(false);
    const [confirmJudge, setConfirmJudge] = useState<Judge | null>(null);

    const handleRemove = async (judge: Judge) => {
        try {
            // await deleteJudgeFromEvent(judge.event_id, judge.personnel_id);
            // useEffect to fetch the judge list
        } catch (error) {
            console.error('Failed to remove judge', error);
        }
        setConfirmJudge(null);
    };

    return (
        <div className="mb-6 flex flex-col md:flex-row md:justify-between gap-8 md:gap-12 w-full border-t pt-8 border-blackl">
            <div className="w-full">
                <div className="flex items-center justify-between w-full  dark:border-white pb-4">
                    <h2 className="text-2xl font-semibold text-secondary">
                        Judges
                    </h2>
                    <button
                    className="px-8 py-2 bg-gray-300 text-black rounded hover:bg-gray-600"
                    onClick={() => setIsEditionMode(!isEditionMode)}>
                        Manage Judges
                    </button>
                </div>

                {isEditionMode ? (
                    <div className="flex list-disc list-inside space-y-1 space-x-20">
                        {judges?.map((judge) => (
                            <div
                                key={judge.personnel_id}
                                className="border border-gray-300 bg-white p-4"
                            >
                                <div className="text-2xl mb-2 text-black text-center font-bold">
                                    {judge.name ?? judge.header}
                                </div>
                                {JudgeQRCode(String(judge.event_id), judge.personnel_id)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        {judges?.map((judge) => (
                            <div
                                key={judge.personnel_id}
                                className="flex items-center justify-between py-2 border-b border-black dark:border-white"
                            >
                                <div className="text-lg font-bold text-left text-black dark:text-white">
                                    {judge.name ?? judge.header}
                                </div>
                                <button
                                    onClick={() => setConfirmJudge(judge)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    REMOVE
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {confirmJudge && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                            <p className="text-2xl text-black dark:text-white">
                                {confirmJudge.name ?? confirmJudge.header} will be removed from the event.
                            </p>
                            <div className="mt-8 flex justify-center space-x-10">
                                <button
                                    onClick={() => handleRemove(confirmJudge)}
                                    className="px-8 py-2 bg-gray-300 text-black rounded hover:bg-red-700 hover:font-bold"
                                >
                                    CONFIRM
                                </button>
                                <button
                                    onClick={() => setConfirmJudge(null)}
                                    className="px-8 py-2 bg-green-600 text-black rounded hover:font-bold"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
