// lib/data.ts
import getDbPool from './db';
import { PoolClient } from 'pg';
import type { SnowEvent } from '@/components/eventListItem';

// Base Event Type
export type { SnowEvent } from '@/components/eventListItem';

// Division Interface
export interface Division {
    division_id: number;
    division_name: string;
}

// For Event Detail Page
export interface RegisteredAthlete {
    athlete_id: number;
    first_name: string;
    last_name: string;
    bib_num: string | null;
}
export interface EventDetails extends SnowEvent {
    divisions: Division[];
    athletes: RegisteredAthlete[];
}

// Discipline Interface
export interface Discipline {
    discipline_id: string;
    category_name: string;
    subcategory_name: string;
    discipline_name: string;
}

// --- Athlete Interface ---
export interface Athlete {
    athlete_id: number;
    last_name: string;
    first_name: string;
    dob: Date;
    gender: string;
    nationality: string | null;
    stance: string | null;
    fis_num: string | null;
}

// --- Function to fetch a single event with details ---
export async function fetchEventById(eventId: number): Promise<EventDetails | null> {
    console.log(`Attempting to fetch event details including athletes for ID: ${eventId}...`);
     if (isNaN(eventId)) {
        console.error("Invalid event ID provided.");
        return null;
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        // Fetch event base details
        const eventResult = await client.query<Omit<SnowEvent, 'start_date' | 'end_date'> & { start_date: string | Date, end_date: string | Date }>(
            'SELECT event_id, name, start_date, end_date, location FROM ss_events WHERE event_id = $1',
            [eventId]
        );
        if (eventResult.rows.length === 0) { console.log(`Event ${eventId} not found.`); return null; }
        const eventData = eventResult.rows[0];

        // Fetch linked divisions
        const divisionResult = await client.query<Division>(
            `SELECT d.division_id, d.division_name
             FROM ss_division d JOIN ss_event_divisions ed ON d.division_id = ed.division_id
             WHERE ed.event_id = $1 ORDER BY d.division_name ASC`,
            [eventId]
        );

        // Fetch registered athletes
        const athleteQuery = `
            SELECT a.athlete_id, a.first_name, a.last_name, r.bib_num
            FROM ss_athletes a JOIN ss_event_registrations r ON a.athlete_id = r.athlete_id
            WHERE r.event_id = $1 ORDER BY a.last_name ASC, a.first_name ASC
        `;
        const athleteResult = await client.query<RegisteredAthlete>(athleteQuery, [eventId]);

        // Combine results
        const eventDetails: EventDetails = {
            event_id: eventData.event_id,
            name: eventData.name,
            location: eventData.location,
            start_date: new Date(eventData.start_date),
            end_date: new Date(eventData.end_date),
            divisions: divisionResult.rows,
            athletes: athleteResult.rows
        };
        return eventDetails;

    } catch (error) { console.error("Error details:", error); return null; }
    finally { if (client) client.release(); }
}

// --- Function to fetch all events (list) ---
export async function fetchEvents(): Promise<SnowEvent[]> {
    console.log("Attempting to fetch all events...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query<Omit<SnowEvent, 'start_date' | 'end_date'> & { start_date: string | Date, end_date: string | Date }>(
          'SELECT event_id, name, start_date, end_date, location FROM ss_events ORDER BY start_date DESC'
        );
        const events: SnowEvent[] = result.rows.map(row => ({
            ...row,
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
        }));
        console.log(`Fetched ${events.length} events.`);
        return events;
    } catch (error) { console.error("Error details:", error); return []; }
    finally { if (client) client.release(); }
}

// --- Function to fetch all disciplines ---
export async function fetchDisciplines(): Promise<Discipline[]> {
    console.log("Attempting to fetch disciplines...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query<Discipline>(
            'SELECT discipline_id, category_name, subcategory_name, discipline_name FROM ss_disciplines ORDER BY category_name, subcategory_name, discipline_name'
        );
        console.log(`Fetched ${result.rows.length} disciplines.`);
        return result.rows;
    } catch (error) { console.error("Error details:", error); return []; }
     finally { if (client) client.release(); }
}

// --- Function to fetch all base divisions ---
export async function fetchAllDivisions(): Promise<Division[]> {
    console.log("Attempting to fetch all base divisions...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query<Division>(
            'SELECT division_id, division_name FROM ss_division ORDER BY division_name ASC'
        );
        console.log(`Fetched ${result.rows.length} base divisions.`);
        return result.rows;
    } catch (error) { console.error("Error details:", error); return []; }
     finally { if (client) client.release(); }
}

// --- Function to fetch assigned division IDs for an event ---
export async function fetchAssignedDivisionIds(eventId: number): Promise<number[]> {
    console.log(`Attempting to fetch assigned division IDs for event ${eventId}...`);
    if (isNaN(eventId)) return [];

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query<{ division_id: number }>(
            'SELECT division_id FROM ss_event_divisions WHERE event_id = $1',
            [eventId]
        );
        const ids = result.rows.map(row => row.division_id);
        console.log(`Found ${ids.length} assigned division IDs for event ${eventId}.`);
        return ids;
    } catch (error) { console.error("Error details:", error); return []; }
    finally { if (client) client.release(); }
}

// --- NEW: Function to fetch all athletes ---
export async function fetchAllAthletes(): Promise<Athlete[]> {
    console.log("Attempting to fetch all athletes...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        // Select relevant columns, order consistently
        const result = await client.query<Omit<Athlete, 'dob'> & { dob: string | Date }>( // Type hint for raw row
            `SELECT
                athlete_id, last_name, first_name, dob, gender,
                nationality, stance, fis_num
             FROM ss_athletes
             ORDER BY last_name ASC, first_name ASC`
        );
        // Ensure DOB is a Date object in the final array
        const athletes: Athlete[] = result.rows.map(row => ({
            ...row,
            dob: new Date(row.dob) // Convert string/date from DB to Date object
        }));
        console.log(`Fetched ${athletes.length} athletes.`);
        return athletes;
    } catch (error) {
        console.error("Error fetching all athletes:", error);
        return []; // Return empty array on error
    } finally {
        if (client) client.release();
    }
}


// --- Date Formatting Helpers ---
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    if (!date || isNaN(date.getTime())) return "Invalid Date";
    const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options ?? defaultOptions);
};
export const formatDateRange = (start: Date, end: Date): string => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid Date Range";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const startDateStr = start.toLocaleDateString("en-US", options);
    const endDateStr = end.toLocaleDateString("en-US", options);
    if (startDateStr === endDateStr) return startDateStr;
    const startMonthYear = start.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    const endMonthYear = end.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    if (startMonthYear === endMonthYear) {
        return `${start.toLocaleDateString("en-US", { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startDateStr} - ${endDateStr}`;
};