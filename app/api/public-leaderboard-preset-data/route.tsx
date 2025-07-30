import { NextResponse, type NextRequest } from "next/server";
import getDbPool from "@/lib/db"; // your custom DB connection utility

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const eventId = params.get("eventId");
  const divisionId = params.get("divisionId");
  const roundId = params.get("roundId");
  const roundHeatId = params.get("roundHeatId");

  // basic validation
  if (!eventId || !divisionId || !roundId || !roundHeatId) {
    return NextResponse.json(
      { error: "Missing one or more required query parameters" },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool(); // assuming PostgreSQL or similar
    const { rows } = await pool.query(
      `
      SELECT 
        rr.event_id,
        rr.division_id,
        rd.round_id,
        rr.round_heat_id,
        rd.round_name
      FROM ss_round_details rd
      JOIN ss_run_results rr ON rd.event_id = rr.event_id
        AND rd.division_id = rr.division_id
      WHERE rr.event_id = $1
        AND rr.division_id = $2
        AND rd.round_id = $3
        AND rr.round_heat_id = $4
      `,
      [eventId, divisionId, roundId, roundHeatId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
