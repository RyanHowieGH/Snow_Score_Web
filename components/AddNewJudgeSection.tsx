'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import Modal from "./PopUpModal";
import { Judge } from '@/lib/definitions';
import { Info, X } from 'lucide-react';

interface AddNewJudgeSectionProps {
  event_id: number,
  onAddJudgeToEvent: (judge: Judge) => void,
}

export default function AddNewJudgeSection({
  event_id,
  onAddJudgeToEvent
  }: AddNewJudgeSectionProps) {
    const [openCreateNewJudge, setCreateNewJudge] = useState(false);

    const [newJudgeHeader, setNewJudgeHeader] = useState<string>("");
    const [newJudgeName, setNewJudgeName] = useState<string>("");

    const handleSubmitNewJudge = async (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        try{
            // implement regex (prevent SQL injection here or any undesired thing)
            const response = await fetch("/api/add-judge-to-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newJudgeName,
                    header: newJudgeHeader,
                    event_id,
                }),
                });
                const data = await response.json();
                onAddJudgeToEvent(data.judge);
                console.log("Score submission response:", data);
        } catch (error) {
            console.error('Failed to add new judge', error);
        }
        finally{
            setCreateNewJudge(false);
            setNewJudgeHeader(""); 
            setNewJudgeName("");
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
                            {/*Tooltip*/}      
                            <div className="relative ml-2 group inline-block">

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
                                The new judge will be assigned to every division, round and heat in this event. The judging panels QR code for this judge will be displayed once the page is refreshed.
                            </div>

                            {/*New Judge form*/}
                            </div>
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