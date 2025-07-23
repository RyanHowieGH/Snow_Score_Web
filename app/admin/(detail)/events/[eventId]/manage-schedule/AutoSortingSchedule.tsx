'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import Link from 'next/link';
import type { ScheduleHeatItem, EventDetails } from '@/lib/definitions';
import { saveHeatTimeAndResequenceAction } from './actions';
import { PrinterIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// --- HELPER FUNCTIONS (REBUILT FOR DATE OBJECTS) ---

/**
 * Formats a Date object into a 'HH:MM' string for the HTML time input.
 */
const formatToTimeInput = (timeValue: Date | string | null): string => {
  if (!timeValue) return '';
  try {
    const date = new Date(timeValue); // Works for both Date objects and ISO strings
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

/**
 * Creates a timezone-unaware "YYYY-MM-DD HH:MM:SS" string for the server.
 */
const createLocalTimestampString = (localDate: string, localTime: string): string | null => {
    if (!localDate || !localTime) return null;
    return `${localDate} ${localTime}:00`;
};

// --- CHILD COMPONENT ---
function ScheduleHeatItemComponent({ item, onTimeChange, onTimeSave }: {
  item: ScheduleHeatItem;
  onTimeChange: (heatId: number, field: 'start_time' | 'end_time', value: string) => void;
  onTimeSave: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center bg-base-100 rounded-lg shadow-sm p-3 gap-2">
      <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="join">
              <input type="time" value={formatToTimeInput(item.start_time)} onChange={(e) => onTimeChange(item.heat_id, 'start_time', e.target.value)} onBlur={onTimeSave} className="input input-bordered input-sm join-item w-28 text-center tabular-nums" />
              <input type="time" value={formatToTimeInput(item.end_time)} onChange={(e) => onTimeChange(item.heat_id, 'end_time', e.target.value)} onBlur={onTimeSave} className="input input-bordered input-sm join-item w-28 text-center tabular-nums" />
          </div>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto flex-grow">
          <span className={`badge ${item.division_name.toUpperCase().includes('MALE') ? 'badge-info' : 'badge-warning'} badge-md whitespace-nowrap`}>{item.division_name}</span>
          <span className="font-semibold whitespace-nowrap">{item.round_name}:</span>
          <span className="whitespace-nowrap">Heat {item.heat_num}</span>
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
  const [isSaving, startSaveTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(() => {
    const eventStartDate = new Date(eventDetails.start_date);
    const tzoffset = eventStartDate.getTimezoneOffset() * 60000;
    return new Date(eventStartDate.getTime() - tzoffset).toISOString().split('T')[0];
  });

  useEffect(() => {
    setHeats(initialHeats);
  }, [initialHeats]);

  const handleTimeChange = (heatId: number, field: 'start_time' | 'end_time', value: string) => {
    const localTimestampString = createLocalTimestampString(selectedDate, value);
    setHeats(currentHeats => 
      currentHeats.map(h => 
        h.heat_id === heatId ? { ...h, [field]: localTimestampString } : h
      )
    );
  };
  
  const handleTimeSave = (heatId: number) => {
    const heatToSave = heats.find(h => h.heat_id === heatId);
    if (!heatToSave) return;
    startSaveTransition(() => {
      // The state correctly holds the local timestamp string
      saveHeatTimeAndResequenceAction(eventId, heatToSave.heat_id, heatToSave.start_time, heatToSave.end_time);
    });
  };

  const filteredHeats = useMemo(() => {
    // Get the target date parts once.
    const targetDate = new Date(`${selectedDate}T12:00:00`); // Use noon to avoid timezone day-shift issues
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    return heats
      .filter(heat => {
        // --- VVV THIS IS THE FINAL, CORRECTED FIX VVV ---
        if (!heat.start_time) {
          return true; // Always show unscheduled heats
        }
        
        // `heat.start_time` from the DB is a Date object.
        // `heat.start_time` after an edit is a "YYYY-MM-DD HH:MM:SS" string.
        // `new Date()` handles both cases correctly.
        const heatDate = new Date(heat.start_time);

        if (isNaN(heatDate.getTime())) {
          console.error("Filtering out invalid date:", heat.start_time);
          return false;
        }

        // Compare the local date parts of the heat's date with the target date
        return heatDate.getFullYear() === targetYear &&
               heatDate.getMonth() === targetMonth &&
               heatDate.getDate() === targetDay;
        // --- ^^^ END OF FIX ^^^ ---
      })
      .sort((a, b) => {
          if (!a.start_time) return 1;
          if (!b.start_time) return -1;
          // Create Date objects for sorting to handle both initial load and edited state
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
  }, [heats, selectedDate]);


  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Manage Schedule</h1>
          <p className="text-sm text-base-content/70">All times are in the event's local timezone (e.g., America/Edmonton).</p>
          <div className="form-control">
             <label htmlFor="schedule-date" className="label py-1"><span className="label-text font-semibold">Showing Heats for Date:</span></label>
            <input id="schedule-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input input-bordered input-sm w-full max-w-xs" />
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 mt-1 self-start">
          <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline"><ArrowUturnLeftIcon className="h-4 w-4" /> Back</Link>
          <button onClick={() => window.print()} className="btn btn-sm btn-outline"><PrinterIcon className="h-4 w-4" /> Print</button>
        </div>
      </div>
      
      <div className="bg-gradient-to-b from-base-200 to-base-100 p-4 rounded-xl shadow-lg border border-base-300">
        <div className="space-y-2">
          {filteredHeats.length > 0 ? (
            filteredHeats.map((heat) => (
              <ScheduleHeatItemComponent
                key={heat.id}
                item={heat}
                onTimeChange={handleTimeChange}
                onTimeSave={() => handleTimeSave(heat.heat_id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-base-content/60">
               <p className="font-semibold">No Heats Found</p>
               <p className="text-sm">There are no heats scheduled for the selected date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}