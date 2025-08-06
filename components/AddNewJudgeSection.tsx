'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import Modal from "./PopUpModal";
import { Judge } from '@/lib/definitions';
import { Info, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

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

    const REGEX_RULE_NAME = /[^\p{L}\s'-]+/gu;
    const REGEX_RULE_HEADER = /[^\p{L}\p{N}\s'-]+/gu;

    const handleSubmitNewJudge = async (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        try{
            const response = await fetch("/api/add-judge-to-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newJudgeName.trim(),
                    header: newJudgeHeader.trim(),
                    event_id,
                }),
                });
                const data = await response.json();
                onAddJudgeToEvent(data.judge);
                console.log("A new judge was added to the event");
                toast.success(`${(newJudgeName.trim() === "" || newJudgeName === null) ? newJudgeHeader : newJudgeName} was assigned to the event`);
        } catch (error) {
            console.error('Failed to add new judge', error);
            toast.error(`Failed to assign ${(newJudgeName.trim() === "" || newJudgeName === null) ? newJudgeHeader : newJudgeName} to the event`);
        }
        finally{
            setCreateNewJudge(false);
            setNewJudgeHeader(""); 
            setNewJudgeName("");
        }
    };

    function handleHeaderChange(e: ChangeEvent<HTMLInputElement>) {
        const regexStrippedHeader = e.target.value.replace(REGEX_RULE_HEADER, "");
        setNewJudgeHeader(regexStrippedHeader);
        }

    function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
        const regexStrippedName = e.target.value.replace(REGEX_RULE_NAME, "");
        setNewJudgeName(regexStrippedName);
        }

    return(
        <div>
            {/* ADD NEW JUDGE */}
            <button 
            className="btn btn-danger ml-[0] mt-[1%]" 
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
                                    onChange={handleHeaderChange}
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
                                    onChange={handleNameChange}
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