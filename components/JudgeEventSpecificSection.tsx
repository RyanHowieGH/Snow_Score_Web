'use client';
// import JudgeQRCode from "./JudgeQRCode";
import { useState } from 'react';
import Modal from "./PopUpModal";
import Image from 'next/image';
import AddNewJudgeSection from './AddNewJudgeSection';


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
    event_id: number;
}

export default function JudgeEventSpecificSection({ judges, event_id }: JudgesProps) {
    const [isEditionMode, setIsEditionMode] = useState(false);
    const [confirmJudgeToRemove, setConfirmJudgeToRemove] = useState<Judge>();
    const [openRemoveJudge, setOpenRemoveJudge] = useState(false);

    function handleSelectJudgeToRemove(judge: Judge) {
        setConfirmJudgeToRemove(judge);
        setOpenRemoveJudge(true);
    }

async function deleteJudge(eventId: number, personnelId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await fetch('/api/delete-judge-from-event', {
      method: 'DELETE',
      body: JSON.stringify({
        eventId,
        personnelId,
      }),
    });
    console.log('Delete successful:');
  } catch (err) {
    console.error('API call failed:', err);
    return null;
  }
}


async function deleteJudgeNullScores(eventId: number, personnelId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result = await fetch('/api/delete-null-scores-from-a-judge', {
        method: 'DELETE',
        body: JSON.stringify({
            eventId,
            personnelId,
        }),
        });
    console.log('Delete successful:');
  } catch (err) {
    console.error('API call failed:', err);
    return null;
  }
}




    const handleRemove = async (judge: Judge) => {
        try {
            await deleteJudgeNullScores(judge.event_id, judge.personnel_id);
            await deleteJudge(judge.event_id, judge.personnel_id);
        } catch (error) {
            console.error('Failed to remove judge', error);
        }
        setOpenRemoveJudge(false);
    };



    return (
        <div className="mb-6 flex flex-col md:flex-row md:justify-between gap-8 md:gap-12 w-full border-t p-12">
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

                {!isEditionMode ? (
                    <div className="flex list-disc list-inside space-y-1 space-x-20 flex-wrap">
                    {judges?.map((judge) => (
                        <div
                        key={judge.personnel_id}
                        className="border border-gray-300 bg-white p-4 flex flex-col items-center flex-shrink-0 mb-4"
                        >
                        <div className="text-2xl mb-2 text-black text-center font-bold">
                            {judge.name ?? judge.header}
                        </div>
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

                                {/* REMOVE JUDGE */}
                                <button className="btn btn-danger" onClick={() => handleSelectJudgeToRemove(judge)}>
                                    <Image
                                    src="/assets/icons/trash.png"
                                    alt={'Trash icon.'}
                                    width={20}
                                    height={20}
                                />
                                Remove
                                </button>

                                <Modal open={openRemoveJudge} onClose={() => setOpenRemoveJudge(false)}>
                                    <div className="text-center">
                                    <div className="mx-auto my-4 w-48">
                                        <h3 className="text-lg font-black text-gray-800 text-center">                                    
                                            <Image
                                            src="/assets/icons/trash.png"
                                            alt={'Trash icon.'}
                                            width={40}
                                            height={40}
                                            className="block mx-auto mb-3"
                                            />
                                        Confirm Delete
                                        </h3>
                                        <p className=" text-gray-500 mt-2">
                                        Are you sure you want to remove {judge.name ?? judge.header} from this event?
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                        className="btn btn-danger w-[50%] ml-[-5]"
                                        onClick={() => confirmJudgeToRemove && handleRemove(confirmJudgeToRemove)}
                                        >Delete</button>
                                        <button
                                        className="btn btn-light w-[50%]"
                                        onClick={() => setOpenRemoveJudge(false)}
                                        >
                                        Cancel
                                        </button>
                                    </div>
                                    </div>
                                </Modal>
                            </div>
                        ))}                            
                    <AddNewJudgeSection
                        judges={judges}
                        event_id={event_id}
                    />
                    </div>
                )}
            </div>
        </div>
    );
}
