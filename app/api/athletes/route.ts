// app/api/athletes/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
    const eventIdParam = req.nextUrl.searchParams.get("event_id");
    if (!eventIdParam) {
      return NextResponse.json(
        { error: "Missing event_id" },
        { status: 400 }
      );
    }

    const eventId = parseInt(eventIdParam, 10);

    // Fetch the specific event by ID
    const eventResult = await pool.query(
      `
      SELECT
        e.event_id,
        e.status,
        e.name AS event_name
      FROM ss_events e
      WHERE e.event_id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (eventResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = eventResult.rows[0];

    // Fetch athletes for this event
    const athletesResult = await pool.query(
      `
      SELECT
        rr.athlete_id,
        reg.bib_num AS bib,
        array_agg(DISTINCT rr.run_num ORDER BY rr.run_num) AS runs
      FROM ss_run_results rr
      JOIN ss_event_registrations reg ON rr.athlete_id = reg.athlete_id
      WHERE rr.event_id = $1
      GROUP BY rr.athlete_id, reg.bib_num
      ORDER BY reg.bib_num
      `,
      [eventId]
    );

    return NextResponse.json({
      event,
      athletes: athletesResult.rows,
    });
  } catch (err) {
    console.error("Error fetching athletes:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

