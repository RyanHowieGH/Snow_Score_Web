import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  const eventIdParam = req.nextUrl.searchParams.get("event_id");
  const divisionIdParam = req.nextUrl.searchParams.get("division_id");

  if (!eventIdParam || !divisionIdParam) {
    return NextResponse.json(
      { error: "Missing event_id or division_id" },
      { status: 400 }
    );
  }

  const eventId = parseInt(eventIdParam);
  const divisionId = parseInt(divisionIdParam);

  if (isNaN(eventId) || isNaN(divisionId)) {
    return NextResponse.json(
      { error: "Invalid round identification API input" },
      { status: 400 }
    );
  }

  try {
    const { rows } = await pool.query<{ max_round_id: number | null }>(
      `
      SELECT 
        MAX(round_id) AS max_round_id
      FROM ss_round_details
      WHERE event_id    = $1
        AND division_id = $2;
      `,
      [eventId, divisionId]
    );

    const maxId = rows[0]?.max_round_id ?? null;

    return NextResponse.json({ max_round_id: maxId });
  } catch (err) {
    console.error("Error fetching the next round identification", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
