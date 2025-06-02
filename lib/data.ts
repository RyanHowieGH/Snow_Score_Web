// lib/data.ts
import getDbPool from './db';
import { PoolClient } from 'pg';

// Import the SnowEvent type from its definition.
// Ensure eventListItem.tsx is ONLY exporting this type and not trying to
// import server-only functions from this lib/data.ts file.
import type { SnowEvent } from '@/components/eventListItem';

// --- Type Definitions ---

// Re-export SnowEvent if you want lib/data.ts to be the canonical source for this type too
export type { SnowEvent } from '@/components/eventListItem';

export interface Division {
    division_id: number;
    division_name: string;
}

export interface Judge {
    personnel_id: string;
    header: string;
    name: string; // Name of the judge. Assumed to be on ss_event_judges or joined.
    event_id: number;
}

export interface RegisteredAthlete {
    athlete_id: number;
    first_name: string;
    last_name: string;
    bib_num: string | null;
}

// This is the main detailed type for an event, used on detail/management pages
export interface EventDetails extends SnowEvent {
    status: string;
    discipline_id?: number; // Foreign key
    discipline_name?: string; // Fetched via JOIN
    divisions: Division[];
    athletes: RegisteredAthlete[];
    judges: Judge[];
}

export interface Discipline {
    discipline_id: string; // Or number, if it's an integer PK in your DB
    category_name: string;
    subcategory_name: string;
    discipline_name: string;
}

export interface Athlete { // For the ss_athletes table
    athlete_id: number;
    last_name: string;
    first_name: string;
    dob: Date; // Will be converted to Date object after fetching
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

        const eventQuery = `
            SELECT
                e.event_id,
                e.name,
                e.start_date,
                e.end_date,
                e.location,
                e.status,
                e.discipline_id,
                d.discipline_name
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

        const divisionQuery = `
            SELECT d.division_id, d.division_name
            FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id
            WHERE ed.event_id = $1
            ORDER BY d.division_name ASC;
        `;

        const athleteQuery = `
            SELECT a.athlete_id, a.first_name, a.last_name, r.bib_num
            FROM ss_athletes a
            JOIN ss_event_registrations r ON a.athlete_id = r.athlete_id
            WHERE r.event_id = $1
            ORDER BY r.bib_num ASC, a.last_name ASC, a.first_name ASC;
        `;

        // Assuming ss_event_judges.name stores the judge's name directly.
        // If it needs a JOIN to ss_users or ss_personnel, adjust this query.
        const judgeQuery = `
            SELECT ej.event_id, ej.personnel_id, ej.header, ej.name
            FROM ss_event_judges ej
            WHERE ej.event_id = $1
            ORDER BY ej.header;
        `;

        const [divisionResult, athleteResult, judgeResult] = await Promise.all([
            client.query<Division>(divisionQuery, [eventId]),
            client.query<RegisteredAthlete>(athleteQuery, [eventId]),
            client.query<Judge>(judgeQuery, [eventId])
        ]);

        const eventDetails: EventDetails = {
            event_id: eventData.event_id,
            name: eventData.name,
            location: eventData.location,
            start_date: new Date(eventData.start_date),
            end_date: new Date(eventData.end_date),
            status: eventData.status,
            discipline_id: eventData.discipline_id,
            discipline_name: eventData.discipline_name,
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
        const result = await client.query(
          'SELECT event_id, name, start_date, end_date, location FROM ss_events ORDER BY start_date DESC'
        );
        const events: SnowEvent[] = result.rows.map(row => ({
            event_id: row.event_id,
            name: row.name,
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
            location: row.location,
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
    console.log("Fetching all athletes (for general lists, not event-specific registration)...");
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
        console.log(`Fetched ${athletes.length} athletes from ss_athletes.`);
        return athletes;
    } catch (error) {
        console.error("Error fetching all athletes:", error);
        return [];
    } finally {
        if (client) client.release();
    }
}

export async function fetchRegisteredAthletesForEvent(eventId: number): Promise<RegisteredAthlete[]> {
    console.log(`Fetching registered athletes for event ID: ${eventId}`);
    if (isNaN(eventId)) {
        console.error("fetchRegisteredAthletesForEvent: Invalid event ID provided.");
        return [];
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const query = `
            SELECT
                a.athlete_id,
                a.first_name,
                a.last_name,
                er.bib_num
            FROM
                ss_athletes a
            JOIN
                ss_event_registrations er ON a.athlete_id = er.athlete_id
            WHERE
                er.event_id = $1
            ORDER BY
                er.bib_num ASC, a.last_name ASC, a.first_name ASC;
        `;
        const result = await client.query<RegisteredAthlete>(query, [eventId]);
        console.log(`Found ${result.rows.length} registered athletes for event ID: ${eventId}.`);
        return result.rows;
    } catch (error) {
        console.error(`Database error fetching registered athletes for event ID ${eventId}:`, error);
        return [];
    } finally {
        if (client) client.release();
    }
}

// Function for deleting judges (kept as per previous state)
export async function deleteJudgeFromEvent(
    eventId: number,
    personnel_id: string
) {
    console.log(`Attempting to delete judge ${personnel_id} from event ${eventId}...`);
    if (isNaN(eventId) || !personnel_id) {
        console.error("deleteJudgeFromEvent: Invalid parameters for deleting judge.");
        return { rowCount: 0, command: 'DELETE', error: 'Invalid parameters', customError: true };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query(
        `
        DELETE FROM ss_event_judges
        WHERE event_id = $1 AND personnel_id = $2
        `,
        [eventId, personnel_id]
        );
        console.log(`Delete judge result for event ${eventId}, personnel ${personnel_id}: ${result.rowCount} rows affected.`);
        return result; // pg QueryResult
    } catch (error) {
        console.error(`Error deleting judge ${personnel_id} from event ${eventId}:`, error);
        return { rowCount: 0, command: 'DELETE', error: (error as Error).message, customError: true };
    } finally {
        if (client) client.release();
    }
}


// --- Date Formatting Helpers ---
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