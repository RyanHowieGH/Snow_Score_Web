'use client';
import JudgeQRCode from "./JudgeQRCode";
import { useState, useEffect } from 'react';
import Modal from "./PopUpModal";
import Image from 'next/image';
import AddNewJudgeSection from './AddNewJudgeSection';


// Judge Interface
export interface Judge {
    personnel_id: string;
    header: string | null;
    name: string | null;
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
    const [renderedJudges, setRenderedJudges] = useState(judges);

    function handleSelectJudgeToRemove(judge: Judge) {
        setConfirmJudgeToRemove(judge);
        setOpenRemoveJudge(true);
    }

async function deleteJudge(eventId: number, personnelId: string) {
  try {
    await fetch('/api/delete-judge-from-event', {
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
            setRenderedJudges((renderedJudges ?? []).filter((judgeToRemove: Judge) => judgeToRemove.personnel_id !== judge.personnel_id))
        } catch (error) {
            console.error('Failed to remove judge', error);
        }
        setOpenRemoveJudge(false);
    };
        
    const handleAddJudgeToEvent = (newJudge: Judge) => {
        setRenderedJudges(prev => [...prev ?? [], newJudge]);
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
                    <div>
                        {renderedJudges?.map((judge) => (
                            <div
                                key={judge.personnel_id}
                                className="flex items-center justify-between py-2 border-b border-black dark:border-white"
                            >
                                <div className="text-lg font-bold text-left text-black dark:text-white">
                                    {(judge.name === "" ||  judge.name === null) ? judge.header : judge.name }
                                </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div>
                        {renderedJudges?.map((judge) => (
                            <div
                                key={judge.personnel_id}
                                className="flex items-center justify-between py-2 border-b border-black dark:border-white"
                            >
                                <div className="text-lg font-bold text-left text-black dark:text-white">
                                    {(judge.name === "" || judge.name === null) ? judge.header : judge.name }
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

                                {openRemoveJudge && confirmJudgeToRemove?.personnel_id === judge.personnel_id && (
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
                                            Are you sure you want to remove {(judge.name === "" || judge.name === null) ? judge.header : judge.name} from this event?
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
                                )}
                            </div>
                        ))}                            
                    <AddNewJudgeSection
                        event_id={event_id}
                        onAddJudgeToEvent={handleAddJudgeToEvent}
                    />
                    </div>
                )}
            </div>
        </div>
    );
}
