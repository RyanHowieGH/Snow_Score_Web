'use client';
import { useState, FormEvent, ChangeEvent, useMemo } from 'react';
import Modal from "./PopUpModal";
import { Judge } from '@/lib/definitions';
import { Info, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface AddNewJudgeSectionProps {
  event_id: number,
  onAddJudgeToEvent: (judge: Judge) => void,
}

const VALID_NAME_REGEX = /^[\p{L}\s'-]*$/u; // Names usually don't have numbers
const VALID_HEADER_REGEX = /^[\p{L}\p{N}\s'-]*$/u; // Headers can have numbers (e.g., Judge 1)

export default function AddNewJudgeSection({
  event_id,
  onAddJudgeToEvent
  }: AddNewJudgeSectionProps) {
    const [openCreateNewJudge, setCreateNewJudge] = useState(false);

    const [newJudgeHeader, setNewJudgeHeader] = useState<string>("");
    const [newJudgeName, setNewJudgeName] = useState<string>("");

    const [headerError, setHeaderError] = useState<string>('');
    const [nameError, setNameError] = useState<string>('');

    // Memoize the validity check to avoid re-calculating on every render
    const isFormValid = useMemo(() => {
        // 1. Check individual field validity
        const isHeaderFormatValid = VALID_HEADER_REGEX.test(newJudgeHeader);
        const isNameFormatValid = VALID_NAME_REGEX.test(newJudgeName);

        // 2. Check business rule: Header is required
        const isHeaderFilled = newJudgeHeader.trim() !== '';

        // 3. The form is valid if all formats are correct AND the required header field is filled.
        return isHeaderFormatValid && isNameFormatValid && isHeaderFilled;
    }, [newJudgeHeader, newJudgeName]);


    const handleSubmitNewJudge = async (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        if (!isFormValid) {
            toast.error("Please fix the errors before saving.");
            return;
        }

        try {
            const response = await fetch("/api/add-judge-to-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newJudgeName.trim(), // Send trimmed values
                    header: newJudgeHeader.trim(), // Send trimmed values
                    event_id,
                }),
            });

            if (!response.ok) {
                // Handle server-side validation errors
                const errorData = await response.json();
                throw new Error(errorData.error || "Server rejected the request.");
            }

            const data = await response.json();
            onAddJudgeToEvent(data.judge);
            toast.success(`${(newJudgeName.trim() === "" || newJudgeName === null) ? newJudgeHeader : newJudgeName} was assigned to the event`);
            
            // Close and reset form
            setCreateNewJudge(false);
            setNewJudgeHeader(""); 
            setNewJudgeName("");
            setHeaderError('');
            setNameError('');

        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            console.error('Failed to add new judge', error);
            toast.error(`Failed to assign judge: ${message}`);
        }
    };
    
    // --- VVV NEW: Handlers with validation VVV ---
    const handleHeaderChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewJudgeHeader(value);
        if (!VALID_HEADER_REGEX.test(value)) {
            setHeaderError("Header contains invalid characters.");
        } else {
            setHeaderError('');
        }
    };
    
    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewJudgeName(value);
        if (!VALID_NAME_REGEX.test(value)) {
            setNameError("Name contains invalid characters.");
        } else {
            setNameError('');
        }
    };

    return (
        <div>
            <button className="btn btn-primary" onClick={() => setCreateNewJudge(true)}>
                Add Judge
            </button>

            <Modal open={openCreateNewJudge} onClose={() => setCreateNewJudge(false)}>
                <form onSubmit={handleSubmitNewJudge}>
                    {/* ... (Tooltip and Title) ... */}
                    <div className='flex-col flex space-y-4'>
                        {/* Header Input with Error Handling */}
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Header*</span></div>
                            <input
                                type="text"
                                value={newJudgeHeader}
                                onChange={handleHeaderChange}
                                className={`input input-bordered w-full ${headerError ? 'input-error' : ''}`}
                                placeholder="e.g., Judge 1"
                                required
                            />
                            {headerError && <div className="label"><span className="label-text-alt text-error">{headerError}</span></div>}
                        </label>

                        {/* Name Input with Error Handling */}
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Name (Optional)</span></div>
                            <input
                                type="text"
                                value={newJudgeName}
                                onChange={handleNameChange}
                                className={`input input-bordered w-full ${nameError ? 'input-error' : ''}`}
                                placeholder="e.g., Jane Doe"
                            />
                            {nameError && <div className="label"><span className="label-text-alt text-error">{nameError}</span></div>}
                        </label>
                    </div>

                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={() => setCreateNewJudge(false)}>Cancel</button>
                        <button type="submit" disabled={!isFormValid} className="btn btn-primary">
                            Save Judge
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}