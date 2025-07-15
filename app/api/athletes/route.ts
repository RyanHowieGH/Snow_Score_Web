// app/api/athletes/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
    const eventIdParam = req.nextUrl.searchParams.get("event_id");
    if (!eventIdParam) {
      return NextResponse.json(
        { error: "Missing the event identifier" },
        { status: 400 }
      );
    }

    const roundIdParam = req.nextUrl.searchParams.get("round_id");
    if (!roundIdParam) {
      return NextResponse.json(
        { error: "Missing the round identifier" },
        { status: 400 }
      );
    }

    const divisionIdParam = req.nextUrl.searchParams.get("division_id");
    if (!divisionIdParam) {
      return NextResponse.json(
        { error: "Missing the division identifier" },
        { status: 400 }
      );
    }

    const roundHeatIdParam = req.nextUrl.searchParams.get("round_heat_id");
    if (!roundHeatIdParam) {
      return NextResponse.json(
        { error: "Missing round-heat identifier" },
        { status: 400 }
      );
    }

    const eventId = parseInt(eventIdParam, 10);
    const roundHeatId = parseInt(roundHeatIdParam);

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

    // Fetch unique runs for each athlete (one row per athlete_id + run_num)
    const athletesResult = await pool.query(
      `
      SELECT *
      FROM (
        SELECT DISTINCT ON (rr.athlete_id, rr.run_num)
            rr.athlete_id,
            reg.bib_num AS bib,
            rr.run_num,
            hr.round_heat_id,
            hr.division_id,
            hr.seeding
        FROM ss_run_results    rr
        JOIN ss_heat_results   hr ON rr.round_heat_id = hr.round_heat_id
                                AND rr.athlete_id   = hr.athlete_id
        JOIN ss_event_registrations reg 
                                ON hr.event_id      = reg.event_id 
                                AND hr.division_id  = reg.division_id
                                AND rr.athlete_id   = reg.athlete_id
        WHERE rr.event_id       = $1
          AND rr.round_heat_id  = $2
        ORDER BY rr.athlete_id,
                rr.run_num,
                hr.seeding   ASC
      ) t
      ORDER BY t.seeding    ASC,
               t.run_num   ASC;
    `,
      [eventId, roundHeatId]
    );




    // Build unique athlete -> runs map
    const athletesMap = new Map<number, {athlete_id: number; bib: number; runs: { run_num: number; round_heat_id: number; seeding: number }[];}>();

    for (const row of athletesResult.rows) {
      if (!athletesMap.has(row.athlete_id)) {
        athletesMap.set(row.athlete_id, {
          athlete_id: row.athlete_id,
          bib: row.bib,
          runs: [],
        });
      }

      athletesMap.get(row.athlete_id)!.runs.push({
        run_num: row.run_num,
        round_heat_id: row.round_heat_id,
        seeding: row.seeding,
      });
    }

    // Final API response
    return NextResponse.json({
      event,
      athletes: Array.from(athletesMap.values()),
    });

  } catch (err) {
    console.error("Error fetching athletes:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
