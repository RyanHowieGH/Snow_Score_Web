import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  const eventIdParam = req.nextUrl.searchParams.get("event_id");

  if (!eventIdParam) {
    return NextResponse.json(
      { error: "Missing event_id or division_id" },
      { status: 400 }
    );
  }

  const eventId = parseInt(eventIdParam);

  if (isNaN(eventId)) {
    return NextResponse.json(
      { error: "Invalid round identification API input" },
      { status: 400 }
    );
  }

  try {
    const { rows } = await pool.query<{ name: string | null }>(
      `
      SELECT name
      FROM ss_events
      WHERE event_id    = $1;
      `,
      [eventId]
    );

    const name = rows[0]?.name ?? null;

    return NextResponse.json({ name });
  } catch (err) {
    console.error("Error fetching the next round identification", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
