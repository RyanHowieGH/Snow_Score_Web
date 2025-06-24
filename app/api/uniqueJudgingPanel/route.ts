// app/api/uniqueJudgingPanel/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { PoolClient } from "pg";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const eventIdStr = searchParams.get("eventId");
    const divisionIdStr = searchParams.get("divisionId");
    const roundIdStr = searchParams.get("roundId");
    const heatIdStr = searchParams.get("heatId"); // Assuming you meant round_heat_id
    const personnelIdStr = searchParams.get("personnelId");

    // Validate and parse all parameters
    if (!eventIdStr || !divisionIdStr || !roundIdStr || !heatIdStr || !personnelIdStr) {
        return NextResponse.json({ error: "Missing one or more required query parameters (eventId, divisionId, roundId, heatId, personnelId)" }, { status: 400 });
    }

    const event_id = parseInt(eventIdStr, 10);
    const division_id = parseInt(divisionIdStr, 10);
    const round_id = parseInt(roundIdStr, 10);
    const round_heat_id = parseInt(heatIdStr, 10);
    const personnel_id = parseInt(personnelIdStr, 10);

    if (isNaN(event_id) || isNaN(division_id) || isNaN(round_id) || isNaN(round_heat_id) || isNaN(personnel_id)) {
        return NextResponse.json({ error: "All ID parameters must be valid numbers." }, { status: 400 });
    }

    console.log(`API: /api/uniqueJudgingPanel GET request with params:`, { event_id, division_id, round_id, round_heat_id, personnel_id });

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        // Corrected your SQL query:
        // - ss_round_details doesn't have division_name. Joined ss_division for it.
        // - Ensured all JOIN conditions are complete.
        // - Placed WHERE clause correctly.
        const query = `
            SELECT
                rd.event_id,
                rd.division_id,
                div.division_name, -- Fetched from ss_division
                rd.round_id,
                hd.round_heat_id,
                ej.personnel_id,
                e.name AS event_name -- Aliased e.name to avoid conflict if other tables have 'name'
            FROM ss_round_details rd
            JOIN ss_heat_details hd ON rd.round_id = hd.round_id
            -- JOIN ss_heats_results hr ON hr.round_heat_id = hd.round_heat_id -- This join might be for specific results, not just panel info
            JOIN ss_event_divisions ed ON ed.event_id = rd.event_id AND ed.division_id = rd.division_id
            JOIN ss_division div ON ed.division_id = div.division_id -- To get division_name
            JOIN ss_event_judges ej ON rd.event_id = ej.event_id AND ej.personnel_id = $5 -- Join specific judge
            JOIN ss_events e ON e.event_id = rd.event_id
            WHERE rd.event_id = $1
              AND rd.division_id = $2
              AND rd.round_id = $3
              AND hd.round_heat_id = $4;
        `;
        // Note: The original query's WHERE ej.event_id = $1 was redundant if ej is already joined on event_id.
        // The query above is structured to find details related to a specific judge on a specific heat.
        // If you want ALL judges for a specific heat, you'd remove `AND ej.personnel_id = $5` from the main WHERE
        // and potentially from the JOIN condition for ss_event_judges if you select all judges for that event.

        const { rows } = await pool.query(query, [
            event_id,
            division_id,
            round_id,
            round_heat_id,
            personnel_id
        ]);

        return NextResponse.json(rows);

    } catch (err: unknown) {
        console.error("Error fetching unique judging panel data:", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ error: "Server error fetching data.", details: message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}