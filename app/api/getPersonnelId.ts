// pages/api/getPersonnelId.ts (optional helper API)
import getDbPool from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const pool = getDbPool();
  const { user_id, event_id } = await req.json();

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT personnel_id FROM ss_event_personnel WHERE user_id = $1 AND event_role = 'judge' AND event_id = $2`,
      [user_id, event_id]
    );

    if (result.rows.length === 0) {
      return new Response("Judge not registered for this event", { status: 404 });
    }

    return new Response(JSON.stringify({ personnel_id: result.rows[0].personnel_id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    client.release();
  }
}
