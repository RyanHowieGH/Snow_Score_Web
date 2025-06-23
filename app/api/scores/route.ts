import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { round_heat_id, run_num, personnel_id, score } = await req.json();

    // Step 1: Get the correct run_result_id
    const result = await pool.query(
      `SELECT run_result_id FROM ss_run_scores WHERE round_heat_id = $1 AND run_num = $2`,
      [round_heat_id, run_num]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Run result not found" },
        { status: 404 }
      );
    }

    const run_result_id = result.rows[0].run_result_id;

    // Step 2: Insert into ss_run_scores
    //I changed the order of the parameters to match the database schema
    await pool.query(
      `
        INSERT INTO ss_run_scores (personnel_id, run_result_id, score)
        VALUES ($1, $2, $3)
        ON CONFLICT (personnel_id, run_result_id)
        DO UPDATE SET score = EXCLUDED.score
      `,
      [personnel_id, run_result_id, score]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error saving score:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
