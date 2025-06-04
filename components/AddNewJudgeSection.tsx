'use client';
import { useState } from 'react';
import Modal from "./PopUpModal";


    // Judge Interface
    export interface Judge {
        personnel_id: string;
        header: string;
        name: string;
        event_id: number;
    }

    // JudgesProps Interface
    export interface EventJudgesProps {
        judges: Judge[] | null;
        event_id: Number;
    }


export default function AddNewJudgeSection({
    judges,
    event_id
} : EventJudgesProps) {
    const [confirmJudgeToAdd, setConfirmJudgeToAdd] = useState<string>('');
    const [openAddJudge, setOpenAddJudge] = useState(false);
    const [openCreateNewJudge, setCreateNewJudge] = useState(false);

    // New Judge Properties (ss_event_judges)
    const [newJudgeHeader, setNewJudgeHeader] = useState<String>("")
    const [newJudgerName, setNewJudgeName] = useState<String>("")
    // new personnel_id would be a sequence
    // how to get the event id if this is an external component from the event page???


    const handleAdd = async (judge: Judge) => {
        try {
            // PENDING: create the function and fix tls error...
            // await addJudgeFromEvent(judge.event_id, judge.personnel_id);
            // useEffect to fetch the judge list
        } catch (error) {
            console.error('Failed to add judge', error);
        }
        setOpenAddJudge(false);
    };


    return(
        <div>
                    {/* ADD NEW JUDGE */}
            <button 
            className="btn  mt-2 p-2 border-green-400 border-solid border-2 font-bold w-25" 
            onClick={() => setOpenAddJudge(true)}>
                Add +
            </button>

            {/* ADD NEW JUDGE FROM LIST */}
                <Modal open={openAddJudge} onClose={() => setOpenAddJudge(false)}>
                    <div className="text-center">
                    <div className="mx-auto my-2 w-48">
                        <h5 className="text-lg font-black text-gray-800 text-center">                                                                            
                        Add Judge
                        </h5>
                        {/* <p className=" text-gray-498 mt-2">
                            DO WE WANT TO HAVE ANYTHING AS A SUBTITLE? 
                        </p> */}
                    </div>
                            <select
                                id="selectedJudgeToAdd"
                                value={confirmJudgeToAdd}
                                onChange={e => setConfirmJudgeToAdd(e.target.value)}
                                className="border border-gray-298 rounded px-2 py-1 w-full text-black">
                                    <option 
                                        value="" 
                                        disabled>
                                            Registered Judges
                                    </option>

                                {judges?.map((judge) => (
                                <option 
                                    key={judge.personnel_id} 
                                    value={judge.personnel_id}>
                                        {judge.name ?? judge.header}
                                </option>
                                ))}
                            </select>

                    <div className="flex gap-2 mt-5">
                        <button 
                        className="btn btn-danger w-[52%] ml-[-5]"
                        onClick={() => {
                            const selectedJudge = judges?.find(
                                j => j.personnel_id === confirmJudgeToAdd) ?? null;
                            if (selectedJudge) 
                                {
                                    handleAdd(selectedJudge);
                                }
                            setOpenAddJudge(false);
                        }}
                        >Add</button>
                        <button
                        className="btn btn-danger w-[52%] ml-[-5]"
                        onClick={() => setOpenAddJudge(false)}>
                        Cancel
                        </button>
                    </div>
                    <div>
                        <button
                        className="btn bg-green-598 mt-2 w-full border-green-700"
                        onClick={() => {
                            setOpenAddJudge(false);
                            setCreateNewJudge(true)}}>
                                Create New
                        </button>
                    </div>
                    </div>
                </Modal>


            {/* CREATE AND ADD NEW JUDGE */}
                <Modal open={openCreateNewJudge} onClose={() => setCreateNewJudge(false)}>
                    <div>
                            aaaaa
                    </div>

                </Modal>
        </div>
    )
}