'use client';
import { useState, useEffect } from 'react';
import Modal from './PopUpModal';
import type { HeadJudge } from '@/lib/definitions';

interface EditHeadJudgeButtonProps {
  eventId: number;
  userRoleId?: number;
}

export default function EditHeadJudgeButton({ eventId, userRoleId }: EditHeadJudgeButtonProps) {
  const [open, setOpen] = useState(false);
  const [headJudges, setHeadJudges] = useState<Partial<HeadJudge>[]>([]);
  const [selectedId, setSelectedId] = useState('');

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
      await fetch(`api/replaceHeadJudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(selectedId) })
      });
      setOpen(false);
    } catch (err) {
      console.error('Failed to update head judge', err);
    }
  };

  return (
    <>
      <button className="btn btn-xs btn-outline" onClick={() => setOpen(true)}>
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4 w-64">
          <h3 className="font-bold text-lg text-center">Edit head judge</h3>
          <p className="text-sm text-center">Assign new head judge to this event</p>
          <select
            className="select select-bordered w-full text-black"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
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
            <button className="btn btn-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!selectedId}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}