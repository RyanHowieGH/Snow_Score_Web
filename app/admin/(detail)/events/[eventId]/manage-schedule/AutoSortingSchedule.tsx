'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ScheduleHeatItem, EventDetails } from '@/lib/definitions';
import { saveHeatTimeAndResequenceAction } from './actions';
import { PrinterIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const formatToTimeInput = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    // Handles ISO strings from the database
    return new Date(dateString).toTimeString().slice(0, 5);
  } catch (e) {
    return '';
  }
};

// This is now a "controlled component". It has no internal state and is
// fully controlled by its parent.
function ScheduleHeatItem({
  item,
  onTimeChange,
  onTimeSave,
}: {
  item: ScheduleHeatItem;
  onTimeChange: (heatId: number, field: 'start_time' | 'end_time', value: string) => void;
  onTimeSave: () => void;
}) {
  return (
    <div className="flex items-center bg-base-100 rounded-lg shadow-sm pl-3">
      <div className="flex-grow flex items-center gap-2 p-2">
        <input
          type="time"
          value={formatToTimeInput(item.start_time)}
          onChange={(e) => onTimeChange(item.heat_id, 'start_time', e.target.value)}
          onBlur={onTimeSave}
          className="input input-ghost input-xs w-24 font-mono text-center"
        />
        <span className="text-base-content/40">-</span>
        <input
          type="time"
          value={formatToTimeInput(item.end_time)}
          onChange={(e) => onTimeChange(item.heat_id, 'end_time', e.target.value)}
          onBlur={onTimeSave}
          className="input input-ghost input-xs w-24 font-mono text-center"
        />
        <span className={`badge ${item.division_name.toUpperCase().includes('MALE') ? 'badge-info' : 'badge-warning'} badge-sm`}>
          {item.division_name}
        </span>
        <span className="font-semibold">{item.round_name}:</span>
        <span>Heat {item.heat_num}</span>
      </div>
    </div>
  );
}

// Main Manager Component - No Drag-and-Drop, just auto-sorting.
export function AutoSortingSchedule({ initialHeats, eventDetails, eventId }: { initialHeats: ScheduleHeatItem[], eventDetails: EventDetails, eventId: number }) {
  const [heats, setHeats] = useState(initialHeats);
  
  // This function is passed to each child to update the main state
  const handleTimeChange = (heatId: number, field: 'start_time' | 'end_time', value: string) => {
    // This should ideally get the date from a stateful date picker
    const selectedDate = new Date(eventDetails.start_date).toISOString().split('T')[0];
    const fullDateTimeString = value ? `${selectedDate}T${value}` : null;

    setHeats(currentHeats => 
      currentHeats.map(h => 
        h.heat_id === heatId ? { ...h, [field]: fullDateTimeString } : h
      )
    );
  };
  
  // This function is called onBlur to sort and save the heat that was just edited
  const handleTimeSave = (heatId: number) => {
    const heatToSave = heats.find(h => h.heat_id === heatId);
    if (!heatToSave) return;

    // --- NEW SORTING LOGIC ---
    // Create a new sorted array from the *current* state
    const sortedHeats = [...heats].sort((a, b) => {
        // Heats with no start time go to the end
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        // Compare valid start times
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    // Update the UI with the correctly sorted list
    setHeats(sortedHeats);
    
    // Call the server action to persist the change for the edited heat
    // The action will then re-sequence everything on the server to guarantee consistency on reload
    saveHeatTimeAndResequenceAction(eventId, heatToSave.heat_id, heatToSave.start_time, heatToSave.end_time);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-base-content/70">Event timezone: America/Edmonton (GMT-6)</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline"><ArrowUturnLeftIcon className="h-4 w-4" /> Back</Link>
          <button className="btn btn-sm btn-outline"><PrinterIcon className="h-4 w-4" /> Print</button>
        </div>
      </div>
      <div className="bg-gradient-to-b from-blue-100 to-white p-4 rounded-xl shadow-lg border border-blue-200">
        <div className="space-y-2">
          {heats.map((heat) => (
            <ScheduleHeatItem
              key={heat.id}
              item={heat}
              onTimeChange={handleTimeChange}
              onTimeSave={() => handleTimeSave(heat.heat_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}