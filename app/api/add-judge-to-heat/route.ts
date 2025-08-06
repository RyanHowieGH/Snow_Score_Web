import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { Judge } from "@/lib/definitions";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { name, header, heat_id } = await req.json();

    // Insert judge metadata
    await pool.query(
      `
      CALL add_heat_judge($1, $2, $3);
      `,
      [heat_id, header, name]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error adding judge to heat`, err);
    return NextResponse.json(
      { error: "Server error adding judge to heat" },
      { status: 500 }
    );
  }
}
