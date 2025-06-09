// app/api/run-result/route.ts

import { NextRequest } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();
  const { searchParams } = new URL(req.url);
  const round_heat_id = Number(searchParams.get("round_heat_id"));
  const run_num = Number(searchParams.get("run_num"));

  if (!round_heat_id || !run_num) {
    return new Response("Missing params", { status: 400 });
  }

  try {
    const query = `
      SELECT run_result_id
      FROM ss_run_results
      WHERE round_heat_id = $1 AND run_num = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [round_heat_id, run_num]);

    if (result.rowCount === 0) {
      return new Response("No matching run_result_id", { status: 404 });
    }

    return new Response(JSON.stringify({ run_result_id: result.rows[0].run_result_id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching run_result_id:", err);
    return new Response("DB error", { status: 500 });
  }
}
