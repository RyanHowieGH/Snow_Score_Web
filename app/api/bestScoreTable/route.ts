// app/api/bestScoreTable/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

type BestScore = {
  bib_num: number;
  best: number;
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

    const roundHeatId = parseInt(roundHeatIdParam, 10);

    const bestScoresResult = await pool.query<BestScore>(
      `
        SELECT bib_num, best
        FROM ss_event_registrations er
        JOIN ss_heat_results hr
          ON er.event_id = hr.event_id
         AND er.division_id = hr.division_id
         AND er.athlete_id = hr.athlete_id
        WHERE hr.round_heat_id = $1
        ORDER BY best DESC
      `,
      [roundHeatId]
    );

    const rows = bestScoresResult.rows;
    const bestScores: BestScore[] = rows.map(({ bib_num, best }) => ({
      bib_num,
      best,
    }));

    return NextResponse.json(bestScores);
    
  } catch (err) {
    console.error("Error fetching best scores:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}