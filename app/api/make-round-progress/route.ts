import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  const sourceRoundIdParam = req.nextUrl.searchParams.get("source_round_id");
  if (!sourceRoundIdParam) {
    return NextResponse.json(
      { error: "Missing source_round_id" },
      { status: 400 }
    );
  }
  const sourceRoundId = parseInt(sourceRoundIdParam);
  if (isNaN(sourceRoundId)) {
    return NextResponse.json(
      { error: "Invalid source_round_id" },
      { status: 400 }
    );
  }

  try {
    await pool.query(
      `CALL progress_and_synchronize_round($1);`,
      [sourceRoundId]
    );

    return NextResponse.json(
      { success: true, source_round_id: sourceRoundId },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in progress-and-sync:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}