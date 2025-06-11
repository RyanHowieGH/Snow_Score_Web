// lib/data.ts
import getDbPool from './db';
import { PoolClient } from 'pg';
// Import types from the centralized definitions file
import type {
    SnowEvent,
    Division,
    Judge,
    RegisteredAthlete,
    HeadJudge,
    EventDetails,
    Discipline,
    Athlete
} from './definitions';
// Note: formatDate and formatDateRange should be imported from lib/utils.ts where they are used, not usually from here.

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
                 e.event_id, e.name, e.start_date, e.end_date, e.location, e.status,
                 e.discipline_id, d.discipline_name
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
             FROM ss_division d JOIN ss_event_divisions ed ON d.division_id = ed.division_id
             WHERE ed.event_id = $1 ORDER BY d.division_name ASC;
         `;
         const athleteQuery = `
             SELECT a.athlete_id, a.first_name, a.last_name, r.bib_num
             FROM ss_athletes a JOIN ss_event_registrations r ON a.athlete_id = r.athlete_id
             WHERE r.event_id = $1 ORDER BY r.bib_num ASC, a.last_name ASC, a.first_name ASC;
         `;
         const judgeQuery = `
             SELECT ej.event_id, ej.personnel_id, ej.header, ej.name
             FROM ss_event_judges ej WHERE ej.event_id = $1 ORDER BY ej.header;
         `;
         const headJudgeQuery = `
             SELECT ej.event_id, ej.user_id, ej.event_role, u.first_name, u.last_name, u.role_id, u.email
             FROM ss_event_personnel ej JOIN ss_users u ON ej.user_id = u.user_id
             WHERE ej.event_id = $1 AND u.role_id = 2;
         `;

         const judgingPanelQuery = `
            SELECT rd.event_id, rd.division_id, rd.division_name, rd.round_id, hd.round_heat_id, ej.personnel_id
            FROM ss_round_details rd JOIN ss_heat_details hd ON rd.round_id = hd.round_id
            JOIN ss_heats_results hr ON hr.round_heat_id = hd.round_heat_id
            JOIN ss_event_divisions ed ON ed.division_id = rd.division_id            JOIN ss_event_judges ej ON rd.event_id = ej.event_id
            WHERE ej.event_id = $1;
         `;
         // TO FINISH
         // judgingPanelQuery + judgeQuery to create the Judging Panel and to create the QRCodes > then map it to create the pages, can we create the pages from a mapping function?

         const [divisionResult, athleteResult, judgeResult, headJudgeResult] = await Promise.all([
             client.query<Division>(divisionQuery, [eventId]),
             client.query<RegisteredAthlete>(athleteQuery, [eventId]),
             client.query<Judge>(judgeQuery, [eventId]),
             client.query<HeadJudge>(headJudgeQuery, [eventId])
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
             headJudge: headJudgeResult.rows,
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
          'SELECT event_id, name, start_date, end_date, location, status FROM ss_events ORDER BY start_date DESC'
        );
        const events: SnowEvent[] = result.rows.map(row => ({
            event_id: row.event_id,
            name: row.name,
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
            location: row.location,
            status: row.status,
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
         return result.rows.map(d => ({...d, discipline_id: Number(d.discipline_id)})); // Assuming discipline_id is number in type
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
        const result = await client.query( // No specific type hint needed if using map
            `SELECT
                athlete_id, last_name, first_name, dob, gender,
                nationality, stance, fis_num
             FROM ss_athletes
             ORDER BY last_name ASC, first_name ASC`
        );
        const athletes: Athlete[] = result.rows.map(row => ({
            athlete_id: row.athlete_id,
            last_name: row.last_name,
            first_name: row.first_name,
            dob: new Date(row.dob), // Convert to Date
            gender: row.gender,
            nationality: row.nationality,
            stance: row.stance,
            fis_num: row.fis_num,
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

// VVV --- THIS FUNCTION WAS MISSING --- VVV
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
// ^^^ --- THIS FUNCTION WAS MISSING --- ^^^


export async function deleteJudgeFromEvent(
    eventId: number,
    personnel_id: string
): Promise<import('pg').QueryResult<any> | { rowCount: number; command: string; error: string; customError: true }> { // More specific return type
    console.log(`Attempting to delete judge ${personnel_id} from event ${eventId}...`);
    if (isNaN(eventId) || !personnel_id) {
        console.error("deleteJudgeFromEvent: Invalid parameters for deleting judge.");
        return { rowCount: 0, command: 'DELETE', error: 'Invalid parameters', customError: true };
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query( // Removed specific type hint for QueryResult
        `
        DELETE FROM ss_event_judges
        WHERE event_id = $1 AND personnel_id = $2
        `, // No RETURNING clause here means QueryResult is more generic
        [eventId, personnel_id]
        );
        console.log(`Delete judge result for event ${eventId}, personnel ${personnel_id}: ${result.rowCount} rows affected.`);
        return result;
    } catch (error) {
        console.error(`Error deleting judge ${personnel_id} from event ${eventId}:`, error);
        return { rowCount: 0, command: 'DELETE', error: (error as Error).message, customError: true };
    } finally {
        if (client) client.release();
    }
}