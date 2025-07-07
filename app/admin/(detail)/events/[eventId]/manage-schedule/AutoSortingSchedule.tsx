'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
// --- FIX: Import types from the single source of truth ---
import type { ScheduleHeatItem, EventDetails } from '@/lib/definitions';
import { saveHeatTimeAndResequenceAction } from './actions';
import { PrinterIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';


// --- DELETED ---
// The local type definitions that were causing the conflict have been removed.
// We are now importing the official ones from '@/lib/definitions' above.


// --- HELPER FUNCTIONS ---

/**
 * Formats an ISO datetime string into a 'HH:MM' string for the time input.
 * @param dateString - The ISO datetime string from the database.
 * @returns A string in 'HH:MM' format, or an empty string if input is invalid.
 */
const formatToTimeInput = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toTimeString().slice(0, 5);
  } catch (e) {
    console.error("Invalid date string:", dateString);
    return '';
  }
};


// --- CHILD COMPONENT: A SINGLE HEAT ROW ---

function ScheduleHeatItemComponent({ item, onTimeChange, onTimeSave }: {
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
          // --- BEST: `font-mono` removed, `tabular-nums` added ---
          className="input input-ghost input-s w-38 text-center text-lg pr-8 tabular-nums"
        />
        <span className="text-base-content/40">-</span>
        <input
          type="time"
          value={formatToTimeInput(item.end_time)}
          onChange={(e) => onTimeChange(item.heat_id, 'end_time', e.target.value)}
          onBlur={onTimeSave}
          // --- BEST: `font-mono` removed, `tabular-nums` added ---
          className="input input-ghost input-s w-38 text-center text-lg pr-8 tabular-nums"
        />
        <span className={`badge ${item.division_name.toUpperCase().includes('MALE') ? 'badge-info' : 'badge-warning'} badge-md`}>
          {item.division_name}
        </span>
        <span className="font-semibold">{item.round_name}:</span>
        <span>Heat {item.heat_num}</span>
      </div>
    </div>
  );
}


// --- MAIN COMPONENT: THE SCHEDULE MANAGER ---

export function AutoSortingSchedule({ initialHeats, eventDetails, eventId }: {
  initialHeats: ScheduleHeatItem[];
  eventDetails: EventDetails;
  eventId: number;
}) {
  const [heats, setHeats] = useState(initialHeats);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date(eventDetails.start_date).toISOString().split('T')[0];
  });

  const handleTimeChange = (heatId: number, field: 'start_time' | 'end_time', value: string) => {
    const fullDateTimeString = value ? `${selectedDate}T${value}` : null;
    setHeats(currentHeats => 
      currentHeats.map(h => 
        h.heat_id === heatId ? { ...h, [field]: fullDateTimeString } : h
      )
    );
  };
  
  const handleTimeSave = (heatId: number) => {
    const heatToSave = heats.find(h => h.heat_id === heatId);
    if (!heatToSave) return;

    const sortedHeats = [...heats].sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
    setHeats(sortedHeats);
    
    saveHeatTimeAndResequenceAction(eventId, heatToSave.heat_id, heatToSave.start_time, heatToSave.end_time);
  };

  const filteredHeats = useMemo(() => {
    return heats.filter(heat => {
      if (!heat.start_time) {
        return true;
      }
      const heatDate = new Date(heat.start_time).toISOString().split('T')[0];
      return heatDate === selectedDate;
    });
  }, [heats, selectedDate]);


  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Manage Schedule</h1>
          <p className="text-sm text-base-content/70">Event timezone: America/Edmonton (GMT-6)</p>
          <div className="form-control">
             <label htmlFor="schedule-date" className="label py-1">
                <span className="label-text font-semibold">Showing Heats for Date:</span>
            </label>
            <input
              id="schedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input input-bordered input-sm w-full max-w-xs"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0 mt-1 self-start">
          <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline"><ArrowUturnLeftIcon className="h-4 w-4" /> Back</Link>
          <button className="btn btn-sm btn-outline"><PrinterIcon className="h-4 w-4" /> Print</button>
        </div>
      </div>

      <div className="bg-gradient-to-b from-blue-50 to-white p-4 rounded-xl shadow-lg border border-blue-200">
        <div className="space-y-2">
          {filteredHeats.length > 0 ? (
            filteredHeats.map((heat) => (
              <ScheduleHeatItemComponent
                // Note: React key should be unique. Using the 'id' from your db is perfect.
                key={heat.id}
                item={heat}
                onTimeChange={handleTimeChange}
                onTimeSave={() => handleTimeSave(heat.heat_id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-base-content/60">
               <p className="font-semibold">No Heats Found</p>
               <p className="text-sm">There are no heats scheduled for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}