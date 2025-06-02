// lib/data.ts
import getDbPool from './db';
import { PoolClient } from 'pg';

// Assuming SnowEvent is defined in this path and has the base event fields
// If it's just a type, it won't cause bundling issues.
// Ensure eventListItem.tsx is not importing server-only functions from this file.
import type { SnowEvent } from '@/components/eventListItem';

// --- Type Definitions ---

// Re-export SnowEvent if it's defined elsewhere and used as a base
export type { SnowEvent } from '@/components/eventListItem';

export interface Division {
    division_id: number;
    division_name: string;
}

export interface Judge {
    // Assuming personnel_id is the primary key for a person who can be a judge
    // and ss_event_judges links event_id, personnel_id, and role/header.
    personnel_id: string; // This might be a user ID or a specific personnel ID
    header: string;       // e.g., "Head Judge", "Technical Delegate", "Judge 1"
    name: string;         // Name of the judge (likely fetched via a JOIN in a real scenario or stored denormalized)
    event_id: number;     // To confirm it's for this event
}

export interface RegisteredAthlete {
    athlete_id: number;
    first_name: string;
    last_name: string;
    bib_num: string | null;
}

export interface EventDetails extends SnowEvent { // Extends your base SnowEvent type
    status: string;                     // ADDED for event status
    discipline_id?: number;             // The ID of the discipline
    discipline_name?: string;           // ADDED for discipline name
    divisions: Division[];
    athletes: RegisteredAthlete[];
    judges: Judge[];
}

export interface Discipline {
    discipline_id: string; // Assuming string from previous usage, but often integer in DB
    category_name: string;
    subcategory_name: string;
    discipline_name: string;
}

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

// --- Data Fetching Functions ---

export async function fetchEventById(eventId: number): Promise<EventDetails | null> {
    console.log(`Fetching event details (ID: ${eventId}) including status, discipline, divisions, athletes, judges...`);
    if (isNaN(eventId)) {
        console.error("fetchEventById: Invalid event ID provided.");
        return null;
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();

        // Fetch main event data including status and join for discipline name
        const eventQuery = `
            SELECT
                e.event_id,
                e.name,
                e.start_date,
                e.end_date,
                e.location,
                e.status,          -- Select the status
                e.discipline_id,   -- Select discipline_id from events table
                d.discipline_name  -- Select the discipline name via JOIN
            FROM ss_events e
            LEFT JOIN ss_disciplines d ON e.discipline_id = d.discipline_id
            WHERE e.event_id = $1;
        `;
        const eventResult = await client.query(eventQuery, [eventId]);

        if (eventResult.rows.length === 0) {
            console.log(`Event with ID ${eventId} not found.`);
            return null;
        }
        const eventData = eventResult.rows[0];

        // Fetch linked divisions in parallel
        const divisionQuery = `
            SELECT d.division_id, d.division_name
            FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id
            WHERE ed.event_id = $1
            ORDER BY d.division_name ASC;
        `;

        // Fetch registered athletes in parallel
        const athleteQuery = `
            SELECT a.athlete_id, a.first_name, a.last_name, r.bib_num
            FROM ss_athletes a
            JOIN ss_event_registrations r ON a.athlete_id = r.athlete_id
            WHERE r.event_id = $1
            ORDER BY a.last_name ASC, a.first_name ASC;
        `;

        // Fetch assigned judges in parallel
        // Assuming ss_event_judges stores judge assignments.
        // If 'name' needs to come from another table (e.g., ss_users or ss_personnel), you'd add a JOIN here.
        const judgeQuery = `
            SELECT ej.event_id, ej.personnel_id, ej.header, p.name -- Assuming 'name' comes from a personnel table 'p'
            FROM ss_event_judges ej
            LEFT JOIN ss_personnel p ON ej.personnel_id = p.personnel_id -- Example join for judge name
            WHERE ej.event_id = $1
            ORDER BY ej.header;
        `;
        // If ss_event_judges.name directly stores the name, then no join needed for 'name' there.
        // Your previous query was:
        // SELECT event_id, personnel_id, header, name FROM ss_event_judges WHERE event_id = $1 ORDER BY header
        // This implies 'name' is directly on ss_event_judges or was a placeholder. I'll use this simpler one
        // based on your last provided judge query. If name needs a join, adjust above.
        const simplerJudgeQuery = `
            SELECT event_id, personnel_id, header, name
            FROM ss_event_judges
            WHERE event_id = $1
            ORDER BY header;
        `;


        const [divisionResult, athleteResult, judgeResult] = await Promise.all([
            client.query<Division>(divisionQuery, [eventId]),
            client.query<RegisteredAthlete>(athleteQuery, [eventId]),
            client.query<Judge>(simplerJudgeQuery, [eventId])
        ]);

        const eventDetails: EventDetails = {
            // Fields from SnowEvent base type
            event_id: eventData.event_id,
            name: eventData.name,
            location: eventData.location,
            start_date: new Date(eventData.start_date), // Ensure conversion to Date
            end_date: new Date(eventData.end_date),     // Ensure conversion to Date
            // Added fields
            status: eventData.status,
            discipline_id: eventData.discipline_id,
            discipline_name: eventData.discipline_name,
            // Aggregated/Joined data
            divisions: divisionResult.rows,
            athletes: athleteResult.rows,
            judges: judgeResult.rows,
        };
        return eventDetails;

    } catch (error) {
        console.error(`Database error in fetchEventById for event ID ${eventId}:`, error);
        return null;
    } finally {
        if (client) client.release();
    }
}

export async function fetchEvents(): Promise<SnowEvent[]> {
    console.log("Fetching all events...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        // Ensure you select all fields required by SnowEvent
        const result = await client.query(
          'SELECT event_id, name, start_date, end_date, location FROM ss_events ORDER BY start_date DESC'
        );
        const events: SnowEvent[] = result.rows.map(row => ({
            ...row,
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
        }));
        console.log(`Fetched ${events.length} events.`);
        return events;
    } catch (error) {
        console.error("Error fetching all events:", error);
        return [];
    } finally {
        if (client) client.release();
    }
}

export async function fetchDisciplines(): Promise<Discipline[]> {
    console.log("Fetching disciplines...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query<Discipline>(
            'SELECT discipline_id, category_name, subcategory_name, discipline_name FROM ss_disciplines ORDER BY category_name, subcategory_name, discipline_name'
        );
        console.log(`Fetched ${result.rows.length} disciplines.`);
        return result.rows;
    } catch (error) {
        console.error("Error fetching disciplines:", error);
        return [];
    } finally {
        if (client) client.release();
    }
}

export async function fetchAllDivisions(): Promise<Division[]> {
    console.log("Fetching all base divisions...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query<Division>(
            'SELECT division_id, division_name FROM ss_division ORDER BY division_name ASC'
        );
        console.log(`Fetched ${result.rows.length} base divisions.`);
        return result.rows;
    } catch (error) {
        console.error("Error fetching all divisions:", error);
        return [];
    } finally {
        if (client) client.release();
    }
}

export async function fetchAssignedDivisionIds(eventId: number): Promise<number[]> {
    console.log(`Fetching assigned division IDs for event ${eventId}...`);
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
    } catch (error) {
        console.error(`Error fetching assigned division IDs for event ${eventId}:`, error);
        return [];
    } finally {
        if (client) client.release();
    }
}

export async function fetchAllAthletes(): Promise<Athlete[]> {
    console.log("Fetching all athletes...");
    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query(
            `SELECT
                athlete_id, last_name, first_name, dob, gender,
                nationality, stance, fis_num
             FROM ss_athletes
             ORDER BY last_name ASC, first_name ASC`
        );
        const athletes: Athlete[] = result.rows.map(row => ({
            ...row,
            dob: new Date(row.dob)
        }));
        console.log(`Fetched ${athletes.length} athletes.`);
        return athletes;
    } catch (error) {
        console.error("Error fetching all athletes:", error);
        return [];
    } finally {
        if (client) client.release();
    }
}

// This function was for deleting judges, which you said to ignore for now.
// I'll keep it here as it was part of the file.
export async function deleteJudgeFromEvent(
    eventId: number,
    personnel_id: string
    // header was removed as it was not used in the DELETE query logic itself
) {
    console.log(`Attempting to delete judge ${personnel_id} from event ${eventId}...`);
    if (isNaN(eventId) || !personnel_id) {
        console.error("Invalid parameters for deleting judge.");
        // Return a structure that indicates failure or throw an error
        return { rowCount: 0, command: 'DELETE', error: 'Invalid parameters' };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query( // No specific type for RETURNING header if we removed it or don't use it
        `
        DELETE FROM ss_event_judges
        WHERE event_id = $1
            AND personnel_id = $2
        `, // Removed RETURNING header as it wasn't used by consuming code and makes type simpler
        [eventId, personnel_id]
        );
        console.log(`Delete judge result for event ${eventId}, personnel ${personnel_id}: ${result.rowCount} rows affected.`);
        return result; // Returns QueryResult from pg (includes rowCount)
    } catch (error) {
        console.error(`Error deleting judge ${personnel_id} from event ${eventId}:`, error);
        // Return a structure that indicates failure or throw an error
        return { rowCount: 0, command: 'DELETE', error: (error as Error).message };
    } finally {
        if (client) client.release();
    }
}


// --- Date Formatting Helpers ---
// These are pure functions and are fine to be here, or could be moved to a utils.ts
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

    // Check if same month and year for "Month Day1-Day2, Year" format
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${startDateStr} - ${endDateStr}`;
};