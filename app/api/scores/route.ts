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
      event_id,
      round_heat_id,
      run_num,
      score
    } = body;

    // Validate input (lightweight)
    if (
      typeof personnel_id !== "number" ||
      typeof event_id !== "number" ||
      typeof round_heat_id !== "number" ||
      typeof run_num !== "number" ||
      typeof score !== "number"
    ) {
      console.error("Invalid input in POST /api/scores:", body);
      return new Response("Invalid request payload", { status: 400 });
    }

    client = await pool.connect();

    const query = `
      INSERT INTO ss_run_scores (personnel_id, event_id, round_heat_id, run_num, score)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (personnel_id, event_id, round_heat_id, run_num)
      DO UPDATE SET score = EXCLUDED.score;
    `;

    await client.query(query, [
      personnel_id,
      event_id,
      round_heat_id,
      run_num,
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
