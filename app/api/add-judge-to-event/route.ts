import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { name, header, event_id } = await req.json();

    const result = await pool.query<{ max: number }>(
      `SELECT MAX(personnel_id) AS max FROM ss_event_judges`
    );

    const currentMax = result.rows[0].max ?? 0;
    const next_personnel_id = currentMax + 1;

    await pool.query(
      `
      INSERT INTO ss_event_judges (personnel_id, name, header, event_id)
      VALUES ($1, $2, $3, $4)
      `,
      [next_personnel_id, name, header, event_id]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error adding judge to event:", err);
    return NextResponse.json(
      { error: "Server error adding judge" },
      { status: 500 }
    );
  }
}