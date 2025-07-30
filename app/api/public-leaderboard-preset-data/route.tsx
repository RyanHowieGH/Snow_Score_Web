// app/api/events/[eventId]/[divisionId]/[roundId]/[roundHeatId]/route.ts

import { NextResponse } from "next/server";
import getDbPool from "@/lib/db"; // your custom DB connection utility

interface Params {
  eventId: string;
  divisionId: string;
  roundId: string;
  roundHeatId: string;
}

export async function GET(req: Request, { params }: { params: Params }) {
  const { eventId, divisionId, roundId, roundHeatId } = params;

  try {
    const pool = getDbPool(); // assuming PostgreSQL or similar
    const { rows } = await pool.query(
      `
      SELECT 
        rr.event_id,
        rr.division_id,
        rd.round_id,
        rr.round_heat_id,
        rd.round_name,
      FROM ss_round_details rd
      JOIN ss_run_results rr ON rd.event_id = rr.event_id
        AND rd.division_id = rr.division_id
      WHERE event_id = $1
        AND division_id = $2
        AND round_id = $3
        AND round_heat_id = $4
      `,
      [eventId, divisionId, roundId, roundHeatId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
