import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(event_id: number) {
  const pool = getDbPool();

  try {
    const { rows } = await pool.query(`
        SELECT rd.event_id, rd.division_id, rd.division_name, rd.round_id, hd.round_heat_id, ej.personnel_id, e.name
        FROM ss_round_details rd JOIN ss_heat_details hd ON rd.round_id = hd.round_id
        JOIN ss_heats_results hr ON hr.round_heat_id = hd.round_heat_id
        JOIN ss_event_divisions ed ON ed.division_id = rd.division_id            
        JOIN ss_event_judges ej ON rd.event_id = ej.event_id
        JOIN ss_events e ON e.event_id = rd.event_id;
        WHERE ej.event_id = $1;
         `,
        [event_id]);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching judging panel data:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}