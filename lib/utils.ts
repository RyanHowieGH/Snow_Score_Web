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