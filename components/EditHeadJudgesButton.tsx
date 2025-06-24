'use client';
import React, { useState, useEffect } from 'react'; // Added React for JSX
import Modal from './PopUpModal'; // Assuming PopUpModal is in the same directory
// import type { HeadJudge, AppUserWithRole } from '@/lib/definitions'; // Import AppUserWithRole
import { PencilSquareIcon } from '@heroicons/react/24/outline'; // Adjust import path as needed
import type { HeadJudge } from '@/lib/definitions';
import type { AppUserWithRole } from '@/lib/auth/user';
// VVV --- UPDATE THE PROPS INTERFACE --- VVV
export interface EditHeadJudgeButtonProps {
  eventId: number;
  currentUserAppDetails: AppUserWithRole | null; // Expect the full user details object
}
// ^^^ --- UPDATE THE PROPS INTERFACE --- ^^^

export default function EditHeadJudgeButton({ eventId, currentUserAppDetails }: EditHeadJudgeButtonProps) {
  const [open, setOpen] = useState(false);
  const [availableHeadJudges, setAvailableHeadJudges] = useState<Partial<HeadJudge>[]>([]); // Renamed for clarity
  const [selectedHeadJudgeUserId, setSelectedHeadJudgeUserId] = useState<string>(''); // Store as string, convert on save

  // Effect to fetch all potential head judges when modal opens
  useEffect(() => {
    if (!open) return;
    // This API endpoint should return a list of users who *can* be head judges
    // e.g., users with the role_id of 'Head Judge' (which is '2' in your ss_event_personnel query)
    fetch(`/api/users?role=Head Judge`) // Example API, adjust as needed
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch head judges: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.users)) {
            setAvailableHeadJudges(data.users);
        } else {
            console.error('Failed to load head judges or data format incorrect:', data.error || data);
            setAvailableHeadJudges([]);
        }
      })
      .catch(err => {
        console.error('Failed to load head judges', err);
        setAvailableHeadJudges([]);
      });
  }, [open]);

  // Conditional rendering based on current user's role
  if (!currentUserAppDetails) {
    return null; // Don't show button if no user details (e.g., not logged in fully in app context)
  }
  const allowedToEditRoles = ['Executive Director', 'Administrator']; // Roles that can edit head judge
  if (!allowedToEditRoles.includes(currentUserAppDetails.roleName)) {
    return null; // Don't show button if user doesn't have permission
  }


  const handleSave = async () => {
    if (!selectedHeadJudgeUserId) {
        alert("Please select a head judge."); // Basic validation
        return;
    }
    if (!eventId) { // Should not happen if button is rendered
        alert("Event ID is missing.");
        return;
    }

    try {
      // This API endpoint needs to exist and handle updating/assigning the head judge
      // for the given eventId with the selectedHeadJudgeUserId.
      // It might involve deleting existing head judge for the event then inserting new,
      // or an UPSERT operation in your ss_event_personnel table.
      const response = await fetch(`/api/admin/events/${eventId}/assign-head-judge`, { // Example API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: Number(selectedHeadJudgeUserId), // Send as number
            eventRole: 'Head Judge' // Or whatever role string you use
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update head judge: ${response.statusText}`);
      }

      // const resultData = await response.json();
      // console.log("Head judge update result:", resultData);
      alert("Head judge updated successfully!"); // Or use a toast
      setOpen(false);
      // Optionally, trigger a refresh of the parent page's data if needed
      // router.refresh(); // If using Next.js App Router and want to re-fetch server data
    } catch (err) {
      console.error('Failed to update head judge', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Could not update head judge.'}`);
    }
  };

  return (
    <>
      <button
        className="btn btn-xs btn-outline btn-accent hover:btn-accent-focus p-1 ml-1" // Adjusted styling
        onClick={() => setOpen(true)}
        title="Edit Head Judge Assignment"
      >
        <PencilSquareIcon className="h-3 w-3 sm:h-4 sm:w-4" /> {/* Responsive icon size */}
        <span className="hidden sm:inline ml-1 text-xs">Edit HJ</span> {/* Text visible on sm+ screens */}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} modalId={`edit-head-judge-modal-${eventId}`}>
        <div className="space-y-4 w-full max-w-sm p-2"> {/* Adjusted width and padding */}
          <h3 className="font-bold text-lg text-center mb-1">Edit Head Judge</h3>
          <p className="text-xs text-center text-base-content/70 mb-3">
            Assign a new Head Judge to this event.
          </p>
          <div className="form-control w-full">
            <label htmlFor={`head-judge-select-${eventId}`} className="label pb-1">
                <span className="label-text">Select Head Judge:</span>
            </label>
            <select
                id={`head-judge-select-${eventId}`}
                className="select select-bordered select-sm w-full" // Ensure text color contrasts with select bg
                value={selectedHeadJudgeUserId}
                onChange={e => setSelectedHeadJudgeUserId(e.target.value)}
            >
                <option value="" disabled>
                -- Select a User --
                </option>
                {availableHeadJudges.map(hj => (
                // Assuming hj has user_id, first_name, last_name
                // Key should be unique, user_id is good if availableHeadJudges are unique users
                <option key={hj.user_id || `hj-opt-${hj.first_name}-${hj.last_name}`} value={String(hj.user_id)}>
                    {hj.first_name} {hj.last_name} {hj.email ? `(${hj.email})` : ''}
                </option>
                ))}
                {availableHeadJudges.length === 0 && (
                    <option value="" disabled>No eligible head judges found.</option>
                )}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => {setOpen(false); setSelectedHeadJudgeUserId('');}}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={!selectedHeadJudgeUserId}>
              Save Assignment
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}