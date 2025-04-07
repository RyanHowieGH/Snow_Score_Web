// src/lib/data.ts
import getDbPool from './db';
import { PoolClient } from 'pg';
// export type { SnowEvent } from '../components/eventListItem'; // Keep existing Event type export
import type { SnowEvent } from '../components/eventListItem'; // Keep existing Event type export

// Define the Division type based on ss_division
export interface Division {
    division_id: string; // Matches TEXT PRIMARY KEY in ss_division
    division_name: string; // Matches division_name in ss_division
    // Add other fields from ss_division if needed later
}

// Define the combined type for event details including the correct Division type
export interface EventDetails extends SnowEvent {
    divisions: Division[];
    athletes: RegisteredAthlete[]; // Add athletes array
}

export interface RegisteredAthlete {
    athlete_id: number;
    first_name: string;
    last_name: string;
    bib_num: string | null; // Bib number might be null
}

// Function to fetch a single event and its associated divisions
export async function fetchEventById(eventId: number): Promise<EventDetails | null> {
    console.log(`Attempting to fetch event with ID: ${eventId}...`);
    if (isNaN(eventId)) {
        console.error("Invalid event ID provided.");
        return null;
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        console.log("DB client connected for fetchEventById.");

        // Fetch event details - Use a more generic type initially from DB if needed
        // Or stick with <Event> but be aware dates are strings initially
        const eventResult = await client.query<{
             event_id: number;
             name: string;
             start_date: string | Date; // DB returns string/Date
             end_date: string | Date;
             location: string;
        }>(
            'SELECT event_id, name, start_date, end_date, location FROM ss_events WHERE event_id = $1',
            [eventId]
        );

        if (eventResult.rows.length === 0) {
            console.log(`Event with ID ${eventId} not found.`);
            return null;
        }

        const eventData = eventResult.rows[0]; // eventData now has the raw DB types
        console.log(`Found event: ${eventData.name}`); // Should work here

        // Fetch associated divisions (query remains the same)
        const divisionResult = await client.query<Division>(
            `SELECT d.division_id, d.division_name
             FROM ss_division d
             JOIN ss_event_divisions ed ON d.division_id = ed.division_id
             WHERE ed.event_id = $1
             ORDER BY d.division_name ASC`,
            [eventId]
        );
        console.log(`Found ${divisionResult.rows.length} divisions for event ${eventId}.`);

        const athleteQuery = `
            SELECT
                a.athlete_id,
                a.first_name,
                a.last_name,
                r.bib_num
            FROM
                ss_athletes a
            JOIN
                ss_event_registrations r ON a.athlete_id = r.athlete_id
            WHERE
                r.event_id = $1
            ORDER BY
                a.last_name ASC, a.first_name ASC
        `;
        const athleteResult = await client.query<RegisteredAthlete>(athleteQuery, [eventId]);
        console.log(`Found ${athleteResult.rows.length} registered athletes for event ${eventId}.`);

        // --- THIS IS THE CORRECTED PART (Explicit Construction) ---
        // Construct the final object explicitly, assigning each property
        // This directly tells TypeScript what properties the object has.
        const eventDetails: EventDetails = {
            event_id: eventData.event_id,
            name: eventData.name,
            location: eventData.location,
            start_date: new Date(eventData.start_date),
            end_date: new Date(eventData.end_date),
            divisions: divisionResult.rows,
            athletes: athleteResult.rows // Add the fetched athletes
        };
        // --- END OF CORRECTION ---

        // Now, eventDetails strictly conforms to the EventDetails type definition
        return eventDetails;

    } catch (error) {
        console.error(`Error fetching event details for ID ${eventId}:`, error);
        return null;
    } finally {
        if (client) {
            client.release();
            console.log("DB client released for fetchEventById.");
        }
    }
}

// Keep existing fetchEvents function (no changes needed based on schema for this function)
export async function fetchEvents(): Promise<SnowEvent[]> {
    console.log("Attempting to fetch events..."); // Add logging if missing
    const pool = getDbPool(); // Get the singleton pool instance
    let client: PoolClient | null = null; // ---> DECLARE client LOCALLY <---

    try {
        client = await pool.connect(); // Assign to the local client
        console.log("DB client connected for fetchEvents."); // Add logging

        const result = await client.query<{
            event_id: number;
            name: string;
            start_date: string | Date;
            end_date: string | Date;
            location: string;
        }>(
          'SELECT event_id, name, start_date, end_date, location FROM ss_events ORDER BY start_date DESC'
        );
        console.log(`Fetched ${result.rows.length} events.`); // Add logging

        const events: SnowEvent[] = result.rows.map(row => ({
            event_id: row.event_id,
            name: row.name,
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
            location: row.location,
        }));
        return events;

    } catch (error) {
        console.error("Error fetching events:", error);
        return []; // Return empty array on error
    } finally {
        if (client) { // Check the local client
            client.release(); // Release the local client back to the pool
            console.log("DB client released for fetchEvents."); // Add logging
        }
    }
}

// Keep existing formatDate helper (or move to utils)
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    if (isNaN(date.getTime())) return "Invalid Date";
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'long', day: 'numeric'
    };
    return date.toLocaleDateString("en-US", options ?? defaultOptions);
};

// Keep existing formatDateRange helper (or move to utils)
export const formatDateRange = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid Date";
    const startDateStr = start.toLocaleDateString("en-US", options);
    const endDateStr = end.toLocaleDateString("en-US", options);
    if (startDateStr === endDateStr) return startDateStr;
    const startMonthYear = start.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    const endMonthYear = end.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    if (startMonthYear === endMonthYear) {
        const startDay = start.getDate();
        const endDay = end.getDate();
        return `${start.toLocaleDateString("en-US", { month: 'short' })} ${startDay}-${endDay}, ${start.getFullYear()}`;
    }
    return `${startDateStr} - ${endDateStr}`;
};