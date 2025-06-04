// pages/api/getEventId.ts
import getDbPool from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const pool = getDbPool();
  const { event_name } = await req.json();
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT event_id FROM ss_events WHERE name = $1`,
      [event_name]
    );

    if (result.rows.length === 0) {
      return new Response("Event not found", { status: 404 });
    }

    return new Response(JSON.stringify({ event_id: result.rows[0].event_id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    client.release();
  }
}
