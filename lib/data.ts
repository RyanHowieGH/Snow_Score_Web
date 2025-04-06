// src/lib/data.ts (or keep in src/app/admin/page.tsx if preferred)
import getDbPool from './db'; // Adjust path if needed
import { Event } from '../components/eventListItem'; // Assuming EventListItem exports the type

export async function fetchEvents(): Promise<Event[]> {
    console.log("Attempting to fetch events..."); // Add logging
    const pool = getDbPool(); // Get the singleton pool instance
    let client; // Declare client outside try block

    try {
        client = await pool.connect();
        console.log("DB client connected.");
        // Ensure your column names match: id, name, start_date, end_date, location
        const result = await client.query<{
            event_id: number;
            name: string;
            start_date: string | Date; // Type returned by pg might be string or Date
            end_date: string | Date;
            location: string;
        }>(
          'SELECT event_id, name, start_date, end_date, location FROM ss_events ORDER BY start_date DESC'
        );
        console.log(`Fetched ${result.rows.length} events.`);

        // Explicitly map to ensure Date objects and correct type
        const events: Event[] = result.rows.map(row => ({
            event_id: row.event_id,
            name: row.name,
            // Ensure conversion to Date objects
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
            location: row.location,
        }));
        return events;

    } catch (error) {
        console.error("Error fetching events:", error);
        // In a real app, you might want more sophisticated error handling
        return []; // Return empty array on error
    } finally {
        if (client) {
            client.release(); // Release the client back to the pool
            console.log("DB client released.");
        }
    }
}