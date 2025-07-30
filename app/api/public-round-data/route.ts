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
        rr.calc_score,
        a.first_name,
        a.last_name,
        a.athlete_id,
        hr.seeding,
      From ss_run_results rr
      JOIN ss_round_details rd ON rd.event_id = rr.event_id
        AND rd.division_id = rr.division_id
      JOIN ss_athletes a ON rr.athlete_id = a.athlete_id
      JOIN ss_heat_results hr ON rr.event_id = hr.event_id
        AND rr.division_id = hr.division_id
        AND rr.round_id = hr.round_id
        AND rr.round_heat_id = hr.round_heat_id
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
