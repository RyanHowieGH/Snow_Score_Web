import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { PoolClient } from "pg";

// Define an interface for the expected structure of your judging panel data
interface JudgingPanelInfo {
    event_id: number;
    division_id: number;
    division_name: string;
    round_id: number;
    round_heat_id: number;
    personnel_id: number;
    event_name: string; // e.name
    judge_header?: string; // ej.header
    judge_name?: string;   // ej.name
    // Add other fields you select
}

export async function GET(request: NextRequest) { // First parameter is the NextRequest object
    const searchParams = request.nextUrl.searchParams;
    const eventIdString = searchParams.get("eventId");

    if (!eventIdString) {
        return NextResponse.json({ error: "eventId query parameter is required." }, { status: 400 });
    }

    const event_id = parseInt(eventIdString, 10);

    if (isNaN(event_id)) {
        return NextResponse.json({ error: "Invalid eventId format. Must be a number." }, { status: 400 });
    }

    console.log(`API: /api/everyJudgingPanelFromAnEvent - Fetching all judging panels for event_id: ${event_id}`);

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        // This query aims to get all judges associated with any round/heat of a specific event.
        // It assumes that ss_event_judges links judges directly to the event.
        // And that rounds/heats are also linked to the event.
        // You might need to adjust joins based on how "judging panel" is defined across these entities.
        const query = `
            SELECT DISTINCT
                e.event_id,
                e.name AS event_name,
                ej.personnel_id,
                ej.header AS judge_header,
                ej.name AS judge_name, -- Name from ss_event_judges
                u.first_name AS user_first_name,
                u.last_name AS user_last_name,
                d.division_id,
                d.division_name,
                rd.round_id,
                hd.round_heat_id
            FROM ss_events e
            JOIN ss_event_judges ej ON e.event_id = ej.event_id
            LEFT JOIN ss_users u ON ej.personnel_id = u.user_id -- If personnel_id in ss_event_judges is a user_id
            -- The following joins bring in round/heat/division context if a judge is tied to those levels.
            -- If judges are only assigned at the event level, these joins might not be needed or might change.
            LEFT JOIN ss_event_divisions ed ON e.event_id = ed.event_id
            LEFT JOIN ss_division d ON ed.division_id = d.division_id
            LEFT JOIN ss_round_details rd ON ed.event_id = rd.event_id AND ed.division_id = rd.division_id
            LEFT JOIN ss_heat_details hd ON rd.round_id = hd.round_id
            WHERE e.event_id = $1
            ORDER BY d.division_name, rd.round_id, hd.round_heat_id, ej.header;
        `;
        // The original query in your previous example joined ss_heats_results,
        // which might be too granular if you just want the panel setup, not individual scores.
        // The query above is a guess at "every judging panel from an event".
        // You'll need to refine it based on what data constitutes a "judging panel" in your context.

        const result = await client.query(query, [event_id]);

        // Map to a more structured response if needed
        const panels: JudgingPanelInfo[] = result.rows.map(row => ({
            event_id: row.event_id,
            division_id: row.division_id,
            division_name: row.division_name,
            round_id: row.round_id,
            round_heat_id: row.round_heat_id,
            personnel_id: row.personnel_id,
            event_name: row.event_name,
            judge_header: row.judge_header,
            judge_name: row.judge_name || `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim() || null,
        }));

        return NextResponse.json(panels);

    } catch (err: unknown) {
        console.error("Error fetching all judging panels for event:", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ error: "Server error fetching data.", details: message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}