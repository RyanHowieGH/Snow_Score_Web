// lib/data.ts
import getDbPool from './db';
import { PoolClient } from 'pg';
import { HeatForSchedule } from './definitions'; // You will create this type next
import { RoundWithHeats, ScheduleHeatItem } from './definitions'; // Add RoundWithHeats to definitions
import type { RegisteredAthleteWithDivision } from './definitions';
import type { EventResult, PodiumAthlete, ArticleData } from './definitions';
import { UserWithRole } from './definitions';



// Import types from the centralized definitions file
import type {
    SnowEvent,
    Division,
    Judge,
    RegisteredAthlete,
    HeadJudge,
    EventDetails,
    Discipline,
    Athlete,
    JudgingPanelPerEvent
} from './definitions';
// Note: formatDate and formatDateRange should be imported from lib/utils.ts where they are used, not usually from here.



// --- Data Fetching Functions ---
export async function fetchEventScheduleByEventId(eventId: number) {
    const client = await getDbPool().connect();
    try {
        const result = await client.query(`
            SELECT
                rd.round_name,
                hd.heat_num,
                hd.start_time,
                hd.end_time,
                hd.schedule_sequence
            FROM ss_heat_details hd
            JOIN ss_round_details rd ON hd.round_id = rd.round_id
            WHERE rd.event_id = $1
            ORDER BY hd.schedule_sequence ASC;
        `, [eventId]);
        return result.rows;
    } finally {
        client.release();
    }
}

export async function fetchEventById(eventId: number): Promise<EventDetails | null> {
     console.log(`Fetching event details (ID: ${eventId})...`);
     if (isNaN(eventId)) {
         console.error("fetchEventById: Invalid event ID provided.");
         return null;
     }

     const pool = getDbPool();
     let client: PoolClient | null = null;

     try {
         client = await pool.connect();

         // --- THIS QUERY IS NOW CORRECT ---
         const eventQuery = `
             SELECT
                 e.event_id, e.name, e.start_date, e.end_date, e.location, e.status,
                 e.discipline_id, 
                 d.discipline_name,
                 d.category_name,    -- Select category_name
                 d.subcategory_name  -- Select subcategory_name
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
            SELECT
                d.division_id,
                d.division_name,
                ed.num_rounds  -- <<< FETCH num_rounds FROM ss_event_divisions
            FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id
            WHERE ed.event_id = $1
            ORDER BY d.division_name ASC;
        `; // This query now fetches num_rounds
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
             WHERE ej.event_id = $1 AND u.role_id = 5 AND (LOWER(ej.event_role) = 'head judge' OR LOWER(ej.event_role) = 'headjudge');
         `;

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
             category_name: eventData.category_name, // This field is now available
             subcategory_name: eventData.subcategory_name, // This field is now available
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
    const placeholderUrl = "postgres://user:pass@localhost:5432/db";
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === placeholderUrl) {
        console.warn("fetchEvents: database is not configured, returning empty list.");
        return [];
    }

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

export async function fetchEventsFilteredByRoleId(roleId: number): Promise<SnowEvent[]> {
    console.log("Fetching all events...");
    const placeholderUrl = "postgres://user:pass@localhost:5432/db";
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === placeholderUrl) {
        console.warn("fetchEvents: database is not configured, returning empty list.");
        return [];
    }

    const pool = getDbPool();
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query(
          `SELECT e.event_id, name, start_date, end_date, location, status 
          FROM ss_events e
          JOIN ss_event_personnel ep ON e.event_id = ep.event_id
          WHERE user_id = $1
          ORDER BY start_date DESC`, 
          [roleId]
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
         // The type hint <Discipline> assumes the DB returns columns matching the Discipline type directly.
         // If discipline_id from DB might be null but your type says string, you might need to handle it.
         const result = await client.query<Omit<Discipline, 'discipline_id'> & { discipline_id: string | null }>( // More flexible raw type
             'SELECT discipline_id, category_name, subcategory_name, discipline_name FROM ss_disciplines ORDER BY category_name, subcategory_name, discipline_name'
         );

         const processedDisciplines: Discipline[] = [];
         for (const row of result.rows) {
             if (row.discipline_id === null || row.discipline_id === undefined || row.discipline_id.trim() === '') {
                 // If ID is null, undefined, or an empty string, it's problematic for a key if not unique.
                 // Best to skip or log, unless you have a guaranteed unique fallback.
                 console.warn(`Skipping discipline due to invalid or empty ID:`, row);
                 continue; // Skip this discipline
             }
             // No Number() conversion needed if discipline_id is already a string.
             // Just ensure it matches the Discipline type.
             processedDisciplines.push({
                 discipline_id: row.discipline_id, // Already a string (or should be)
                 category_name: row.category_name,
                 subcategory_name: row.subcategory_name,
                 discipline_name: row.discipline_name,
             });
         }
         console.log(`Fetched and processed ${processedDisciplines.length} disciplines.`);
         return processedDisciplines;

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

const validSortColumns = ['athlete_id', 'last_name', 'nationality', 'fis_num'] as const;
type SortColumn = typeof validSortColumns[number];
type SortDirection = 'asc' | 'desc';

export async function fetchAllAthletes(
    // --- VVV NEW: Add sorting parameters VVV ---
    sortBy: SortColumn = 'athlete_id',
    sortDirection: SortDirection = 'asc'
): Promise<Athlete[]> {
    // --- VVV NEW: Validate inputs to ensure they are safe VVV ---
    const orderByColumn = validSortColumns.includes(sortBy) ? sortBy : 'athlete_id';
    const orderDirection = sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const pool = getDbPool();
    try {
        // --- VVV UPDATED: The query now includes dynamic ORDER BY ---
        // Note: We are safely injecting validated column and direction names.
        // DO NOT use parameterized queries ($1, $2) for ORDER BY columns.
        const query = `
            SELECT 
                athlete_id,
                last_name,
                first_name,
                dob,
                gender,
                nationality,
                stance,
                fis_num
            FROM ss_athletes
            ORDER BY ${orderByColumn} ${orderDirection} NULLS LAST;
        `;
        // 'NULLS LAST' is good practice to keep rows with null values at the bottom.

        const result = await pool.query(query);
        return result.rows;

    } catch (error) {
        console.error("Failed to fetch all athletes:", error);
        // In case of error, return an empty array to prevent the page from crashing.
        return [];
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

export async function fetchHeatsForEventSchedule(eventId: number): Promise<HeatForSchedule[]> {
  const pool = getDbPool();
  const query = `
    SELECT
        hd.round_heat_id,
        hd.heat_num,
        hd.start_time,
        hd.end_time,
        rd.round_name,
        div.division_name
    FROM ss_heat_details hd
    JOIN ss_round_details rd ON hd.round_id = rd.round_id
    JOIN ss_event_divisions ed ON rd.event_id = ed.event_id AND rd.division_id = ed.division_id
    JOIN ss_division div ON ed.division_id = div.division_id
    WHERE ed.event_id = $1
    ORDER BY div.division_name, rd.round_name, hd.heat_num;
  `;
  try {
    const result = await pool.query(query, [eventId]);
    return result.rows;
  } catch (error) {
    console.error('Database Error fetching heats for schedule:', error);
    throw new Error('Failed to fetch heats for the event schedule.');
  }
}

export async function fetchJudgingPanelDataByEventId(eventId: number): Promise<JudgingPanelPerEvent [] | null> {
     console.log(`Fetching judging panel details.`);
     if (isNaN(eventId)) {
         console.error("Failed to retrieve judging panel data per event.");
         return null;
     }

     const pool = getDbPool();
     let client: PoolClient | null = null;

     try {
         client = await pool.connect();

         const judgingPanelPerEventQuery = `
            SELECT DISTINCT
                rd.event_id,
                rd.division_id,
                d.division_name,
                rd.round_id,
                hd.heat_num,
                hd.round_heat_id,
                ej.personnel_id,
                ej.header    AS judge_header,
                ej.name      AS judge_name,
                ej.passcode,
                e.name       AS event_name,
                rd.round_name
            FROM   ss_round_details   rd
            JOIN   ss_heat_details    hd     ON rd.round_id       = hd.round_id
            JOIN   ss_heat_results    hr     ON hr.round_heat_id  = hd.round_heat_id
            JOIN   ss_event_divisions ed     ON ed.division_id    = rd.division_id 
            JOIN   ss_heat_judges     hj     ON hj.round_heat_id  = hd.round_heat_id
            JOIN   ss_event_judges    ej     ON ej.personnel_id   = hj.personnel_id
            JOIN   ss_events          e      ON e.event_id        = rd.event_id
            JOIN   ss_division        d      ON d.division_id     = ed.division_id
            WHERE  ej.event_id = $1;
         `;

         const judgingPanelRetrieved = await client.query(judgingPanelPerEventQuery, [eventId]);

         if (judgingPanelRetrieved.rows.length === 0) {
             console.log(`No judging panel found.`);
             return null;
         }
         
         const judgingPanel: JudgingPanelPerEvent [] = judgingPanelRetrieved.rows.map(row => ({
             event_id: row.event_id,
             division_id: row.division_id,
             division_name: row.division_name,
             round_id: row.round_id,
             round_heat_id: row.round_heat_id,
             judge_header: row.judge_header,
             judge_name: row.judge_name,
             heat_num: row.heat_num,
             personnel_id: row.personnel_id,
             name: row.name,
             round_name: row.round_name,
             passcode: row.passcode,
         }));
         return judgingPanel;

     } catch (error) {
         console.error(`Database error in retrieving judging panel data`, error);
         return null;
     } finally {
         if (client) client.release();
     }
}

     export async function fetchJudgingPanelPasscode(personnel_id: number): Promise< number | null> {
     if (isNaN(personnel_id)) {
         console.error("Failed to retrieve judge data.");
         return null;
     }

     const pool = getDbPool();
     let client: PoolClient | null = null;

     try {
         client = await pool.connect();

         const judgePasscodeQuery = `
            SELECT passcode
            FROM   ss_event_judges
            WHERE  personnel_id = $1;
         `;

         const judgingPasscodeRetrieved = await client.query(judgePasscodeQuery, [personnel_id]);

         if (judgingPasscodeRetrieved.rows.length === 0) {
             return null;
         }
         return judgingPasscodeRetrieved.rows[0].passcode;

     } catch (error) {
         console.error(`Database error in retrieving judge data`, error);
         return null;
     } finally {
         if (client) client.release();
     }
}

// This function gets the main event details AND all its rounds/heats in a nested structure
export async function fetchEventForScheduler(eventId: number): Promise<{ event: EventDetails; rounds: RoundWithHeats[] } | null> {
  const pool = getDbPool();
  // First, get the main event details
  const eventDetails = await fetchEventById(eventId);
  if (!eventDetails) return null;

  // Then, get all rounds with their heats aggregated into a JSON array
  const roundsQuery = `
    SELECT
        rd.round_id,
        rd.round_name,
        rd.round_sequence,
        ed.division_id,
        div.division_name,
        COALESCE(
            (SELECT json_agg(h.* ORDER BY h.heat_sequence)
             FROM (
                SELECT hd.round_heat_id, hd.heat_num, hd.start_time, hd.end_time, hd.heat_sequence
                FROM ss_heat_details hd
                WHERE hd.round_id = rd.round_id
             ) AS h),
            '[]'::json
        ) as heats
    FROM ss_round_details rd
    JOIN ss_event_divisions ed ON rd.event_id = ed.event_id AND rd.division_id = ed.division_id
    JOIN ss_division div ON ed.division_id = div.division_id
    WHERE ed.event_id = $1
    ORDER BY rd.round_sequence;
  `;

  try {
    const result = await pool.query(roundsQuery, [eventId]);
    return { event: eventDetails, rounds: result.rows };
  } catch (error) {
    console.error('Database Error fetching nested schedule data:', error);
    throw new Error('Failed to fetch schedule data.');
  }
}

// Fetches a simple, flat list of all heats for an event, enriched
// with round and division names, sorted by the global sequence.
export async function fetchScheduleHeats(eventId: number): Promise<ScheduleHeatItem[]> {
  const pool = getDbPool();
  const query = `
    SELECT
      hd.round_heat_id as heat_id,
      hd.heat_num,
      hd.start_time,
      hd.end_time, -- <-- ADD THIS LINE
      hd.schedule_sequence,
      rd.round_name,
      div.division_name
    FROM
      ss_heat_details hd
    JOIN ss_round_details rd ON hd.round_id = rd.round_id
    JOIN ss_division div ON rd.division_id = div.division_id
    WHERE
      rd.event_id = $1
    ORDER BY
      hd.schedule_sequence;
  `;
  try {
    const result = await pool.query(query, [eventId]);
    return result.rows.map(row => ({ ...row, id: `HEAT-${row.heat_id}` }));
  } catch (error) {
    console.error('Database Error fetching schedule heats:', error);
    throw new Error('Failed to fetch schedule heats.');
  }
}

/**
 * Fetches only the divisions that are specifically assigned to a given event.
 * This is crucial for the athlete registration process.
 * @param eventId The ID of the event.
 * @returns A promise that resolves to an array of Division objects, including num_rounds.
 */
export async function getDivisionsForEvent(eventId: number): Promise<Division[]> {
    console.log(`[data.ts] Fetching assigned divisions for event ID: ${eventId}`);
    if (isNaN(eventId)) {
        console.error("getDivisionsForEvent: Invalid event ID provided.");
        return [];
    }

    const pool = getDbPool();
    try {
        const query = `
            SELECT
                d.division_id,
                d.division_name,
                ed.num_rounds
            FROM ss_division d
            JOIN ss_event_divisions ed ON d.division_id = ed.division_id
            WHERE ed.event_id = $1
            ORDER BY d.division_name;
        `;
        
        const result = await pool.query<Division>(query, [eventId]);
        console.log(`[data.ts] Found ${result.rows.length} divisions for event ${eventId}.`);
        return result.rows;
    } catch (error) {
        console.error(`[data.ts] Database Error fetching divisions for event ${eventId}:`, error);
        throw new Error('Failed to fetch event divisions.');
    }
}

export async function fetchRosterForEvent(eventId: number): Promise<RegisteredAthleteWithDivision[]> {
  console.log(`[data.ts] Fetching full roster for event ID: ${eventId}`);
  if (isNaN(eventId)) return [];

  const pool = getDbPool();
  try {
    const query = `
      SELECT
        a.athlete_id,
        a.first_name,
        a.last_name,
        er.bib_num,
        d.division_id,
        d.division_name
      FROM ss_athletes a
      JOIN ss_event_registrations er ON a.athlete_id = er.athlete_id
      JOIN ss_division d ON er.division_id = d.division_id
      WHERE er.event_id = $1
      ORDER BY d.division_name, a.last_name, a.first_name;
    `;
    const result = await pool.query(query, [eventId]);
    return result.rows;
  } catch (error) {
    console.error(`[data.ts] Database Error fetching roster for event ${eventId}:`, error);
    throw new Error('Failed to fetch event roster.');
  }
}

export async function fetchEventResultsForArticle(eventId: number): Promise<ArticleData | null> {
    const eventDetails = await fetchEventById(eventId);
    if (!eventDetails) return null;

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        // Query to get the top 3 athletes per division for the podium
        const resultsQuery = `
            WITH RankedAthletes AS (
                SELECT
                    er.division_id,
                    a.first_name,
                    a.last_name,
                    a.nationality,
                    hr.best as final_score,
                    ROW_NUMBER() OVER(PARTITION BY er.division_id ORDER BY hr.best DESC) as rank
                FROM ss_heat_results hr
                JOIN ss_event_registrations er ON hr.event_id = er.event_id AND hr.athlete_id = er.athlete_id
                JOIN ss_athletes a ON er.athlete_id = a.athlete_id
                WHERE hr.event_id = $1
            )
            SELECT
                d.division_name,
                json_agg(json_build_object('rank', ra.rank, 'first_name', ra.first_name, 'last_name', ra.last_name, 'nationality', ra.nationality) ORDER BY ra.rank) as podium
            FROM RankedAthletes ra
            JOIN ss_division d ON ra.division_id = d.division_id
            WHERE ra.rank <= 3
            GROUP BY d.division_name;
        `;
        
        // Query to get the top 3 Canadian athletes overall
        const topCanadiansQuery = `
            SELECT first_name, last_name, nationality, best as final_score,
                   ROW_NUMBER() OVER(ORDER BY best DESC) as rank
            FROM ss_heat_results hr
            JOIN ss_athletes a ON hr.athlete_id = a.athlete_id
            WHERE hr.event_id = $1 AND a.nationality = 'CAN'
            ORDER BY final_score DESC
            LIMIT 3;
        `;

        const [resultsResult, topCanadiansResult] = await Promise.all([
            client.query(resultsQuery, [eventId]),
            client.query(topCanadiansQuery, [eventId])
        ]);

        return {
            ...eventDetails,
            results: resultsResult.rows,
            top_canadians: topCanadiansResult.rows,
        };

    } catch (error) {
        console.error(`Database error fetching results for article generation for event ${eventId}:`, error);
        return null;
    } finally {
        client.release();
    }
}

export async function fetchUsersWithRoles(): Promise<UserWithRole[]> {
  const pool = getDbPool();
  try {
    const result = await pool.query<UserWithRole>(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.auth_provider_user_id,
        r.role_name
      FROM ss_users u
      JOIN ss_roles r ON u.role_id = r.role_id
      ORDER BY r.role_id, u.last_name ASC;
    `);
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch users with roles:", error);
    return [];
  }
}