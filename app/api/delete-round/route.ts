import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const roundIdParam = req.nextUrl.searchParams.get("round_id");
  if (!roundIdParam) {
    return NextResponse.json({ error: "Missing round_id" }, { status: 400 });
  }
  const roundId = parseInt(roundIdParam);
  if (isNaN(roundId)) {
    return NextResponse.json({ error: "Invalid round_id" }, { status: 400 });
  }
  const pool = getDbPool();
  try {
    // Remove heats for this round first to maintain FK integrity
    await pool.query("DELETE FROM ss_heat_details WHERE round_id = $1", [roundId]);
    await pool.query("DELETE FROM ss_round_details WHERE round_id = $1", [roundId]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error deleting round:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
