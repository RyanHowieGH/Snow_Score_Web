// app/api/athletes/route.ts
import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET() {
  const pool = getDbPool();

  try {
    const { rows } = await pool.query(`
      SELECT
        rr.athlete_id,
        reg.bib_num AS bib,
        rr.round_heat_id,
        rr.run_num AS runs
      FROM ss_run_results rr
      JOIN ss_event_registrations reg ON rr.athlete_id = reg.athlete_id
      GROUP BY rr.athlete_id, reg.bib_num, rr.round_heat_id
      ORDER BY reg.bib_num
    `);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching athletes:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
