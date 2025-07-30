import { NextResponse, type NextRequest } from "next/server";
import getDbPool from "@/lib/db"; 

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eventId     = searchParams.get("eventId");
  const divisionId  = searchParams.get("divisionId");
  const roundId     = searchParams.get("roundId");

  if (!eventId || !divisionId || !roundId) {
    return NextResponse.json(
      { error: "Missing one or more required query parameters" },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool();
    const { rows } = await pool.query(
      `
      SELECT 
        hr.event_id,
        hr.division_id,
        hd.round_id,
        hr.round_heat_id,
        hr.best,
        a.first_name,
        a.last_name,
        a.athlete_id,
        hr.seeding,
        hd.heat_num,
        er.bib_num
      FROM ss_heat_results hr
      JOIN ss_event_registrations er 
        ON hr.athlete_id = er.athlete_id
        AND hr.division_id = er.division_id
        AND hr.event_id = er.event_id
      JOIN ss_athletes a
        ON a.athlete_id = er.athlete_id
      JOIN ss_heat_details hd
        ON hd.round_heat_id = hr.round_heat_id
      WHERE hr.event_id      = $1
        AND hr.division_id   = $2
        AND hd.round_id      = $3
        AND hr.best ISNULL
      ORDER BY hr.best DESC, hr.seeding;
      `,
      [eventId, divisionId, roundId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
