// lib/utils.ts

export const formatDate = (dateInput: Date | string | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateInput) return "N/A";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";

    const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options ?? defaultOptions);
};

export const formatDateRange = (startInput: Date | string | undefined | null, endInput: Date | string | undefined | null): string => {
    if (!startInput || !endInput) return "N/A";
    const start = startInput instanceof Date ? startInput : new Date(startInput);
    const end = endInput instanceof Date ? endInput : new Date(endInput);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid Date Range";

    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const startDateStr = start.toLocaleDateString("en-US", options);
    const endDateStr = end.toLocaleDateString("en-US", options);

    if (startDateStr === endDateStr) return startDateStr;

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${startDateStr} - ${endDateStr}`;
};

/**
 * Calculates a dynamic, time-based status for an event.
 * @param startDate The event's start date.
 * @param endDate The event's end date.
 * @returns A string: "COMPLETE", "ONGOING", or "UPCOMING".
 */
export const getEventState = (startDate: Date, endDate: Date): 'COMPLETE' | 'ONGOING' | 'UPCOMING' => {
  const now = new Date();

  // For accurate date-only comparison, we should ignore the time part.
  // We set the time to the beginning of the day for `now`.
  now.setHours(0, 0, 0, 0);

  // We set the time of the event end date to the very end of the day.
  // This ensures an event ending "today" is considered ONGOING, not COMPLETE.
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  if (endOfDay < now) {
    return 'COMPLETE';
  }

  // If the start date is today or in the past, and we haven't returned COMPLETE,
  // it must be ONGOING.
  if (startDate <= now) {
    return 'ONGOING';
  }
  
  // If neither of the above, the event must be in the future.
  return 'UPCOMING';
};


export function formatHeatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string'
    ? new Date(dateInput)
    : dateInput;
    
  return date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}