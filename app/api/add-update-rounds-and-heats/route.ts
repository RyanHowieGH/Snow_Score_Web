// app/api/add-update-rounds-and-heats/route.ts

import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { PoolClient } from "pg";
import type { RoundManagement, HeatManagement } from "@/lib/definitions";

export async function PUT(req: Request) {
  const rounds = (await req.json()) as RoundManagement[];
  const client: PoolClient = await getDbPool().connect();

  try {
    // We will still use a transaction for data integrity
    await client.query('BEGIN');

    for (const r of rounds) {
      let roundId = r.round_id;

      // --- VVV THIS IS THE NEW LOGIC VVV ---
      if (roundId === null || roundId === undefined) {
        // --- 1. HANDLE NEW ROUNDS (INSERT) ---
        // The round_id is null, so this is a new round that needs to be inserted.
        const insertRoundQuery = `
          INSERT INTO ss_round_details (event_id, division_id, round_num, round_name, num_heats, round_sequence)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING round_id;
        `;
        const result = await client.query(insertRoundQuery, [
          r.event_id,
          r.division_id,
          r.round_num,
          r.round_name,
          r.num_heats,
          r.round_sequence
        ]);
        
        // Get the new, real round_id that the database just generated
        roundId = result.rows[0].round_id;
        
      } else {
        // --- 2. HANDLE EXISTING ROUNDS (UPDATE) ---
        // The round_id exists, so we update the existing record.
        const updateRoundQuery = `
          UPDATE ss_round_details
          SET round_name = $1, num_heats = $2, round_sequence = $3, round_num = $4
          WHERE round_id = $5 AND event_id = $6 AND division_id = $7;
        `;
        await client.query(updateRoundQuery, [
          r.round_name,
          r.num_heats,
          r.round_sequence,
          r.round_num,
          roundId,
          r.event_id,
          r.division_id,
        ]);
      }
      // --- ^^^ END OF NEW LOGIC ^^^ ---

      // --- 3. UPSERT HEATS FOR THIS ROUND ---
      // Now that we are guaranteed to have a valid, non-null roundId, we can process the heats.
      if (Array.isArray(r.heats)) {
        // First, delete any heats that may have been removed on the client
        const existingHeatNums = r.heats.map(h => h.heat_num);
        await client.query(
          `DELETE FROM ss_heat_details WHERE round_id = $1 AND heat_num NOT IN (${existingHeatNums.join(',')})`,
          [roundId]
        );

        // Then, insert or update the current heats
        for (const h of r.heats as HeatManagement[]) {
          const insertOrUpdateHeatQuery = `
            INSERT INTO ss_heat_details (round_id, heat_num, num_runs)
            VALUES ($1, $2, $3)
            ON CONFLICT (round_id, heat_num)
            DO UPDATE SET num_runs = EXCLUDED.num_runs;
          `;
          await client.query(insertOrUpdateHeatQuery, [
            roundId,
            h.heat_num,
            h.num_runs,
          ]);
        }
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Rounds and heats updated successfully.' }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error upserting rounds & heats:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}