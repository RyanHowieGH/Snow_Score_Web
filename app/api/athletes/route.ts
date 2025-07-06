// app/api/athletes/route.ts
import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET() {
  const pool = getDbPool();

  try {
    // TODO: Grab personnel_id
    const { rows } = await pool.query(`
      SELECT
        rr.athlete_id,
        reg.bib_num AS bib,
        array_agg(DISTINCT rr.run_num ORDER BY rr.run_num) AS runs,
        e.status AS event_status
      FROM ss_run_results rr
      JOIN ss_event_registrations reg ON rr.athlete_id = reg.athlete_id
      JOIN ss_events e ON rr.event_id = e.event_id
      WHERE e.status != 'completed'
      GROUP BY rr.athlete_id, reg.bib_num, e.status
      ORDER BY reg.bib_num
    `);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching athletes:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
