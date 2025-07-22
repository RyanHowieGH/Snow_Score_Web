// app/api/bestScoreTable/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

type BestScore = {
  bib_num: number;
  best_run_score: number;
};

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
    const roundHeatIdParam = req.nextUrl.searchParams.get("round_heat_id");
    if (!roundHeatIdParam) {
      return NextResponse.json(
        { error: "Missing the round-heat identifier" },
        { status: 400 }
      );
    }

        const personnelIdParam = req.nextUrl.searchParams.get("personnel_id");
    if (!personnelIdParam) {
      return NextResponse.json(
        { error: "Missing the personnel identifier" },
        { status: 400 }
      );
    }

    const roundHeatId = parseInt(roundHeatIdParam, 10);
    const personnelId = parseInt(personnelIdParam, 10);

    const bestScoresResult = await pool.query<BestScore>(
      `
      SELECT er.bib_num, MAX(rs.score) AS best_run_score
      FROM ss_event_registrations AS er
        JOIN ss_heat_results AS hr
          ON er.event_id      = hr.event_id
        AND er.division_id   = hr.division_id
        AND er.athlete_id    = hr.athlete_id
        JOIN ss_run_results AS rr
          ON rr.round_heat_id = hr.round_heat_id
          AND rr.athlete_id = hr.athlete_id
        JOIN ss_run_scores AS rs
          ON rs.run_result_id  = rr.run_result_id
        AND rs.personnel_id   = $1
      WHERE hr.round_heat_id = $2          
      GROUP BY er.bib_num
      ORDER BY best_run_score DESC NULLS LAST;
      `,
      [personnelId, roundHeatId]
    );

    const rows = bestScoresResult.rows;
    const best_run_scores: BestScore[] = rows.map(({ bib_num, best_run_score }) => ({
      bib_num,
      best_run_score,
    }));

    return NextResponse.json(best_run_scores);
    
  } catch (err) {
    console.error("Error fetching best scores:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}