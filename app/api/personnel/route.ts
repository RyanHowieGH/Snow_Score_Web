//This is just for testing purposes, to be removed later or replaced
import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET() {
  const pool = getDbPool();

  try {
    const result = await pool.query(`INSERT INTO ss_run_results (
  round_heat_id,
  event_id,
  division_id,
  athlete_id,
  run_num,
  calc_score
) VALUES (
  1001,   -- must match an actual round_heat_id in ss_heat_details
  200,    -- must match an actual event_id in ss_events
  1,      -- must match an actual division_id in ss_division
  300,    -- must match an actual athlete_id in ss_athletes
  1,
  82.75
);
`);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error querying run results:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

