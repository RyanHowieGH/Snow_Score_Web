// app/api/athletes/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
    const roundHeatIdParam = req.nextUrl.searchParams.get("round_heat_id");
    if (!roundHeatIdParam) {
      return NextResponse.json(
        { error: "Missing round-heat identifier" },
        { status: 400 }
      );
    }

    const roundHeatId = parseInt(roundHeatIdParam);


    const personnelIdParam = req.nextUrl.searchParams.get("personnel_id");
    if (!personnelIdParam) {
      return NextResponse.json(
        { error: "Missing judge identifier" },
        { status: 400 }
      );
    }

    const personnelId = parseInt(personnelIdParam);

    const athletesResult = await pool.query(
      `
      SELECT *
      FROM (
        SELECT DISTINCT ON (rr.athlete_id, rr.run_num)
            rr.athlete_id,
            reg.bib_num AS bib,
            rr.run_num,
            hr.round_heat_id,
            hr.division_id,
            hr.seeding,
            rs.score
        FROM ss_run_results    rr
        JOIN ss_heat_results   hr ON rr.round_heat_id = hr.round_heat_id
                                AND rr.athlete_id   = hr.athlete_id
        JOIN ss_event_registrations reg 
                                ON hr.event_id      = reg.event_id 
                                AND hr.division_id  = reg.division_id
                                AND rr.athlete_id   = reg.athlete_id
        JOIN ss_run_scores     rs ON rr.run_result_id = rs.run_result_id
        WHERE rr.round_heat_id  = $1
          AND rs.personnel_id = $2
        ORDER BY rr.athlete_id,
                rr.run_num,
                hr.seeding   ASC
      ) t
      ORDER BY t.seeding    ASC,
               t.run_num   ASC;
    `,
      [roundHeatId, personnelId]
    );




    // Build unique athlete -> runs map
    const athletesMap = new Map<number, {athlete_id: number; bib: number; runs: { run_num: number; round_heat_id: number; seeding: number }[];}>();

    for (const row of athletesResult.rows) {
      if (!athletesMap.has(row.athlete_id)) {
        athletesMap.set(row.athlete_id, {
          athlete_id: row.athlete_id,
          bib: row.bib,
          runs: [],
        });
      }

      athletesMap.get(row.athlete_id)!.runs.push({
        run_num: row.run_num,
        round_heat_id: row.round_heat_id,
        seeding: row.seeding,
      });
    }

    // Final API response
    return NextResponse.json({
      event,
      athletes: Array.from(athletesMap.values()),
    });

  } catch (err) {
    console.error("Error fetching athletes:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
