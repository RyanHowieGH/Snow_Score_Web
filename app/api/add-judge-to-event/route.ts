import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { Judge } from "@/lib/definitions";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { name, header, event_id } = await req.json();


    const personnel_id = await pool.query<{ personnel_id: number }>(
      `
      SELECT add_event_judge($1, $2, $3)
      `,
      [event_id, header, name]
    );
    
      const newJudge: Judge = {
        personnel_id: String(personnel_id),
        name,
        header,
        event_id,
      };

    return NextResponse.json({ success: true, judge: newJudge });
  } catch (err: unknown) {
    console.error("Error adding judge to event:", err);
    return NextResponse.json(
      { error: "Server error adding judge" },
      { status: 500 }
    );
  }
}