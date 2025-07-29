'use client';
import { useState, useEffect } from 'react';
import Modal from './PopUpModal';
import type { HeadJudge } from '@/lib/definitions';
import { toast } from 'react-hot-toast';

interface EditHeadJudgeButtonProps {
  eventId: number;
  userRoleId?: number;
  onAssignHeadjudge: (fullname: string) => void,
}

export default function EditHeadJudgeButton({ eventId, userRoleId, onAssignHeadjudge }: EditHeadJudgeButtonProps) {
  const [open, setOpen] = useState(false);
  const [headJudges, setHeadJudges] = useState<Partial<HeadJudge>[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [onChangeHeadjudgeName, setOnChangeHeadjudgeName] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch('/api/getAllRegisteredHeadJudges')
      .then(res => res.json())
      .then(data => setHeadJudges(data))
      .catch(err => console.error('Failed to load head judges', err));
  }, [open]);

  if (!userRoleId || ![1, 2, 3].includes(userRoleId)) return null;

const handleSave = async () => {
  if (!selectedId) return;
  
  try {
    const res = await fetch(
      `/api/update-headjudge?event_id=${eventId}&user_id=${selectedId}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error(await res.text());

    onAssignHeadjudge(onChangeHeadjudgeName);
    setOpen(false);
    toast.success('Head Judge assigned');
  } catch (err) {
    console.error('Failed to update head judge', err);
    toast.error('Could not assign head judge');
  }
};

  return (
    <>
      <button className="
         btn 
         btn-xs 
         btn-outline
         md:text-sm
         lg:text-md
         lg:btn-sm
         " onClick={() => setOpen(true)}>
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4 w-64">
          <h3 className="font-bold text-lg text-center
           s256:text-xs
           s384:text-sm
           s576:text-base
           md:text-lg
           lg:text-xl
           xl:text-2xl">Edit head judge</h3>
          <p className="text-sm text-center
           s256:text-xs
           s384:text-xs
           s576:text-sm
           md:text-base
           lg:text-lg
           xl:text-xl">Assign new head judge to this event</p>
          <select
            className="select select-bordered font-normal w-full text-black"
            value={selectedId}
            onChange={e => {
              const id = e.target.value;
              setSelectedId(id);
              const hj = headJudges.find(h => String(h.user_id) === id);
              if (hj?.first_name && hj?.last_name) {
                setOnChangeHeadjudgeName(`${hj.first_name} ${hj.last_name}`);
              }
            }}          >
            <option value="" disabled>
              Select head judge
            </option>
            {headJudges.map(hj => (
              <option key={hj.user_id} value={hj.user_id}>
                {hj.first_name} {hj.last_name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button className="btn btn-sm s256:text-xs" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm s256:text-xs" onClick={handleSave} disabled={!selectedId}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}