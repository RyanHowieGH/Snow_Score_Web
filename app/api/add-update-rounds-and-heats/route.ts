import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type { RoundManagement, HeatManagement } from "@/lib/definitions";

export async function PUT(req: NextRequest) {
  const pool = getDbPool();
  let rounds: RoundManagement[];

  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array of RoundManagement objects" },
        { status: 400 }
      );
    }
    rounds = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertOrUpdateRoundQuery = `
      INSERT INTO ss_round_details
        (event_id, division_id, round_id, round_num, round_name, num_heats, round_sequence)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (event_id, division_id, round_id)
      DO UPDATE SET
        round_num      = EXCLUDED.round_num,
        round_name     = EXCLUDED.round_name,
        num_heats      = EXCLUDED.num_heats,
        round_sequence = EXCLUDED.round_sequence;
    `;

    for (const r of rounds) {
      // 2) upsert this round
      await client.query(insertOrUpdateRoundQuery, [
        r.event_id,
        r.division_id,
        r.round_id,
        r.round_num,
        r.round_name,
        r.num_heats,
        r.round_sequence,
      ]);

    const insertOrUpdateHeatQuery = `
      INSERT INTO ss_heat_details
        (round_id, heat_num, num_runs, schedule_sequence)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (round_id, heat_num)
      DO UPDATE SET
        num_runs          = EXCLUDED.num_runs,
        schedule_sequence = EXCLUDED.schedule_sequence;
    `;

      if (Array.isArray(r.heats)) {
        for (const h of r.heats as HeatManagement[]) {
          await client.query(insertOrUpdateHeatQuery, [
            r.round_id,
            h.heat_num,
            h.num_runs,
            h.schedule_sequence,
          ]);
        }
      }
    }

    await client.query("COMMIT");
    return NextResponse.json(
      { success: true, processedRounds: rounds.length },
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error upserting rounds & heats:", err);
    return NextResponse.json(
      { error: "Database error during upsert" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}