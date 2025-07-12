'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
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
    const [newJudgeHeader, setNewJudgeHeader] = useState("");
    const [newJudgeName, setNewJudgeName] = useState("");
    // new personnel_id would be a sequence
    // how to get the event id if this is an external component from the event page???

    const handleSubmitNewJudge = (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        try{
            // write in the database the next number in the sequence for personnel_id, new header, new name, event_id > async
            // useEffect to fetch the judge list
            // implement regex (prevent SQL injection here or any undesired thing)
        } catch (error) {
            console.error('Failed to add new judge', error);
        }
        finally{
            setCreateNewJudge(false);
        }
    };

    return(
        <div>
            {/* ADD NEW JUDGE */}
            <button 
            className="btn btn-danger w-[10%] ml-[0] mt-[1%]" 
            onClick={() =>  setCreateNewJudge(true)}>
                Add judge
            </button>


            {/* CREATE AND ADD NEW JUDGE */}
                <Modal open={openCreateNewJudge} onClose={() => {
                    setCreateNewJudge(false); 
                    setNewJudgeHeader(""); 
                    setNewJudgeName("")}}>
                    <form onSubmit={(e) => handleSubmitNewJudge(e)}>
                        <div>
                            <h3 
                            className='text-black font-bold text-xl text-center mb-5'>
                                New Judge
                            </h3>
                            <div
                            className='flex-col flex'>
                                <div
                                className='inline-flex'>
                                    <span 
                                    className=' text-black mt-1'>                                
                                    Header:
                                    </span>
                                    <input
                                    id="judge_header"
                                    type="text"
                                    value={newJudgeHeader}
                                    onChange={e => setNewJudgeHeader(e.target.value.trim())}
                                    className="border border-gray-300 rounded px-2 py-1 w-full text-black mx-3"
                                    placeholder="Enter header"/>
                                </div>

                                <div
                                className='inline-flex mt-2'>
                                    <span 
                                    className=' text-black mt-1 mx-1'>                                
                                    Name:
                                    </span>
                                    <input
                                    id="judge_name"
                                    type="text"
                                    value={newJudgeName}
                                    onChange={e => setNewJudgeName(e.target.value.trim())}
                                    className="border border-gray-300 rounded px-2 py-1 w-full text-black mx-3"
                                    placeholder="Enter name"/>
                                </div>
                            </div>
                        </div>

                        <button
                        type="submit"
                        disabled={!newJudgeHeader.trim() && !newJudgeName.trim()}
                        className="block mx-auto w-25 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 mt-5"
                        >
                        Save
                        </button>
                    </form>
                </Modal>
        </div>
    )
}