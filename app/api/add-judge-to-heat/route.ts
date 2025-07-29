import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { Judge } from "@/lib/definitions";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { name, header, event_id, heat_id } = await req.json();

    // Get next personnel_id
    const result = await pool.query<{ max: number }>(
      `SELECT MAX(personnel_id) AS max FROM ss_event_judges`
    );
    const currentMax = result.rows[0].max ?? 0;
    const next_personnel_id = currentMax + 1;

    // Insert judge metadata
    await pool.query(
      `
      INSERT INTO ss_event_judges (personnel_id, name, header, event_id)
      VALUES ($1, $2, $3, $4)
      `,
      [next_personnel_id, name, header, event_id]
    );

    // Assign judge to the heat
    await pool.query(
      `
      INSERT INTO ss_heat_judges (round_heat_id, personnel_id)
      VALUES ($1, $2)
      `,
      [heat_id, next_personnel_id]
    );

    const newJudge: Judge = {
      personnel_id: String(next_personnel_id),
      name,
      header,
      event_id,
    };

    return NextResponse.json({ success: true, judge: newJudge });
  } catch (err) {
    console.error("Error adding judge to heat:", err);
    return NextResponse.json(
      { error: "Server error adding judge to heat" },
      { status: 500 }
    );
  }
}
