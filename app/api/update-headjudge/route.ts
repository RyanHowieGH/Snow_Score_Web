import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function POST(req: NextRequest) {
  const pool = getDbPool();
  const HEADJUDGE_ROLE_ID = 5;

  try {
    // parse event_id
    const eventIdParam = req.nextUrl.searchParams.get("event_id");
    if (!eventIdParam) {
      return NextResponse.json(
        { error: "Missing event identifier" },
        { status: 400 }
      );
    }
    const eventId = parseInt(eventIdParam);

    // parse user_id
    const userIdParam = req.nextUrl.searchParams.get("user_id");
    if (!userIdParam) {
      return NextResponse.json(
        { error: "Missing user identifier" },
        { status: 400 }
      );
    }
    const userId = parseInt(userIdParam);

    // remove any existing head judge rows
    await pool.query(
      `DELETE FROM ss_event_personnel
         WHERE event_id = $1
           AND LOWER(event_role) IN ('head judge','headjudge')`,
      [eventId]
    );

    // look up the role name
    const roleResult = await pool.query<{ role_name: string }>(
      `SELECT role_name
         FROM ss_roles
        WHERE role_id = $1;`,
      [HEADJUDGE_ROLE_ID]
    );
    const roleName = roleResult.rows[0]?.role_name;
    if (!roleName) {
      return NextResponse.json(
        { error: "Head-judge role not found" },
        { status: 500 }
      );
    }

    // insert with the actual role_name string
    await pool.query(
      `INSERT INTO ss_event_personnel (event_id, user_id, event_role)
       VALUES ($1, $2, $3);`,
      [eventId, userId, roleName]
    );

    return NextResponse.json(
      { message: "New head judge assigned to event." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error assigning new head judge to event:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}