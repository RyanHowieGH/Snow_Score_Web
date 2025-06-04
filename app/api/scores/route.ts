import { NextRequest } from "next/server";
import getDbPool from "@/lib/db"; // Make sure this matches your import path
import { PoolClient } from "pg";

export async function POST(req: NextRequest) {
  const pool = getDbPool();
  let client: PoolClient | null = null;

  try {
    const body = await req.json();
    const {
      personnel_id,
      run_result_id,
      score
    } = body;

    // Validate input (lightweight)
    if (
      typeof personnel_id !== "number" ||
      typeof run_result_id !== "number" ||
      typeof score !== "number"
    ) {
      console.error("Invalid input in POST /api/scores:", body);
      return new Response("Invalid request payload", { status: 400 });
    }

    client = await pool.connect();

    // Temporary scores are inserted into ss_run_scores table, then with a join the final calculated score is updated in ss_run_results
    // This is done by AI not me (Working off it).
    const query = 
    `INSERT INTO ss_run_scores (personnel_id, run_result_id, score) 
    VALUES ('${personnel_id}', '${run_result_id}', '${score}');`;

    await client.query(query, [
      personnel_id,
      run_result_id,
      score,
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in POST /api/scores:", error);
    return new Response("Failed to save score", { status: 500 });
  } finally {
    if (client) client.release();
  }
}
