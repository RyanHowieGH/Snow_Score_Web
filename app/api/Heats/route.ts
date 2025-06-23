import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET() {
  const pool = getDbPool();

  try {
    const { rows } = await pool.query(`
        
      SELECT
        a.first_name || ' ' || a.last_name AS athlete,
        rr.athlete_id,

        reg.bib_num AS bib,
        rr.round_heat_id,
        array_agg(rr.calc_score ORDER BY rr.calc_score) AS runs
        FROM ss_run_results rr
        JOIN ss_event_registrations reg 
        ON rr.athlete_id = reg.athlete_id AND rr.event_id = reg.event_id
        JOIN ss_athletes a 
        ON a.athlete_id = reg.athlete_id
        GROUP BY rr.athlete_id, reg.bib_num, rr.round_heat_id, a.first_name, a.last_name
        ORDER BY runs;
    `);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching athletes:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
