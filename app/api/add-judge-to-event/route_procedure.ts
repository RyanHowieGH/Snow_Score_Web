import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { event_id, header, name } = await req.json();

    await pool.query(
      `CALL procedure_name($1, $2, $3)`,
      [header, name, event_id]
    );

    // 3) respond that it worked!
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error calling find_best_score:", err);
    return NextResponse.json(
      { error: "Server error calling stored procedure" },
      { status: 500 }
    );
  }
}
