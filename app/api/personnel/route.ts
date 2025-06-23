// app/api/personnel/route.ts
import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET() {
  const pool = getDbPool();

  try {
    const { rows } = await pool.query(`
        SELECT
          personnel_id,
          event_id,
          header,
          name
        FROM ss_event_judges
    `);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching personnel:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
