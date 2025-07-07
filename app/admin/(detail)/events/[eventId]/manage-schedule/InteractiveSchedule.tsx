'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ScheduleHeatItem, EventDetails } from '@/lib/definitions';
import { updateScheduleOrderAction, updateHeatTimesAction } from './actions';
import { PrinterIcon, Bars3Icon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// Helper to format a full ISO date string into a "HH:mm" time string for the input
const formatToTimeInput = (dateString: string | null): string => {
  if (!dateString) return '';
  return new Date(dateString).toTimeString().slice(0, 5);
};

function SortableHeatItem({ item, eventId }: { item: ScheduleHeatItem, eventId: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // --- LOCAL STATE FOR TIME INPUTS ---
  // Each item now manages its own time values for a better UX.
  const [startTime, setStartTime] = useState(formatToTimeInput(item.start_time));
  const [endTime, setEndTime] = useState(formatToTimeInput(item.end_time));

  // Sync state if props change (e.g., after a drag re-renders the list)
  useEffect(() => {
    setStartTime(formatToTimeInput(item.start_time));
    setEndTime(formatToTimeInput(item.end_time));
  }, [item.start_time, item.end_time]);

  // --- SAVE LOGIC ---
  // Saves both start and end time when the user clicks away from either input.
  const handleSaveTimes = () => {
    // This should ideally get the date from a date picker state
    const selectedDate = '2025-07-16'; 
    
    const startDateTime = startTime ? `${selectedDate}T${startTime}` : null;
    const endDateTime = endTime ? `${selectedDate}T${endTime}` : null;

    // Call the server action with both values
    updateHeatTimesAction(eventId, item.heat_id, startDateTime, endDateTime);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center bg-base-100 rounded-lg shadow-sm">
      <button {...attributes} {...listeners} className="p-3 cursor-grab touch-none text-base-content/50 active:bg-base-300/50 rounded-l-lg">
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="flex-grow flex items-center gap-2 p-2">
        {/* Start Time Input */}
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          onBlur={handleSaveTimes}
          className="input input-ghost input-xs w-24 font-mono text-center"
        />
        <span className="text-base-content/40">-</span>
        {/* End Time Input */}
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          onBlur={handleSaveTimes}
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

export function InteractiveSchedule({ initialHeats, eventDetails, eventId }: { initialHeats: ScheduleHeatItem[], eventDetails: EventDetails, eventId: number }) {
  const [heats, setHeats] = useState(initialHeats);
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = heats.findIndex((h) => h.id === active.id);
        const newIndex = heats.findIndex((h) => h.id === over.id);
        const newOrderedHeats = arrayMove(heats, oldIndex, newIndex);
        setHeats(newOrderedHeats);
        const orderedHeatIds = newOrderedHeats.map(h => h.heat_id);
        updateScheduleOrderAction(eventId, orderedHeatIds);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-base-content/70">Event timezone: America/Edmonton (GMT-6)</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
            <ArrowUturnLeftIcon className="h-4 w-4" /> Back to Details
          </Link>
          <button className="btn btn-sm btn-outline">
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
        </div>
      </div>
      
      <div className="bg-gradient-to-b from-blue-100 to-white p-4 rounded-xl shadow-lg border border-blue-200">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={heats.map(h => h.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {heats.map((heat) => (
                <SortableHeatItem key={heat.id} item={heat} eventId={eventId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}