import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type { ScoresHJData } from "@/lib/definitions";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {

  const eventIdParam = req.nextUrl.searchParams.get('event_id');
  if (!eventIdParam) {
    return NextResponse.json({ error: 'Missing data for get-division-round-heat API request' }, { status: 400 });
  }

  const eventId = parseInt(eventIdParam);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid request for get-division-round-heat API request' }, { status: 400 });
  }

  const roundHeatIdParam = req.nextUrl.searchParams.get('round_heat_id');
  const roundIdParam = req.nextUrl.searchParams.get('round_id');
  if (!roundHeatIdParam && !roundIdParam) {
    return NextResponse.json({ error: 'Missing data for get-division-round-heat API request' }, { status: 400 });
  }

  if (roundHeatIdParam) {
    const roundHeatId = parseInt(roundHeatIdParam);
    if (isNaN(roundHeatId)) {
      return NextResponse.json({ error: 'Invalid request for get-division-round-heat API request' }, { status: 400 });
    }

    const { rows } = await pool.query<{
      run_num: number;
      athlete_id: number;
      score: number;
      header: string;
      name: string;
      run_average: number;
      best_heat_average: number;
      personnel_id: number;
      run_result_id: number;
    }>(
      `
      SELECT
        rr.run_num,
        rr.athlete_id,
        rs.score,
        ej.header,
        ej.name,
        rr.calc_score AS run_average,
        hr.best AS best_heat_average,
        rs.personnel_id,
        rs.run_result_id
      FROM ss_run_results rr
      JOIN ss_run_scores rs
        ON rr.run_result_id = rs.run_result_id
      JOIN ss_heat_results hr
        ON hr.round_heat_id = rr.round_heat_id
        AND hr.event_id = rr.event_id
        AND hr.division_id = rr.division_id
        AND hr.athlete_id = rr.athlete_id
      JOIN ss_event_judges ej
        ON rs.personnel_id = ej.personnel_id
        WHERE rr.event_id = $1
        AND rr.round_heat_id = $2
      ORDER BY rr.athlete_id, rr.run_num;
      `,
      [eventId, roundHeatId]
    );

  if (rows.length === 0) {
      return NextResponse.json({ error: 'No data for the get-division-round-heat API request' }, { status: 404 });
    }

    const scores = 1;

    return NextResponse.json(scores);
  }

    if (roundIdParam) {
    const roundId = parseInt(roundIdParam);
    if (isNaN(roundId)) {
      return NextResponse.json({ error: 'Invalid request for get-division-round-heat API request' }, { status: 400 });
    }


    const { rows } = await pool.query<{
      run_num: number;
      athlete_id: number;
      score: number;
      header: string;
      name: string;
      run_average: number;
      best_heat_average: number;
      personnel_id: number;
      run_result_id: number;
    }>(
      `
      SELECT
        rr.run_num,
        rr.athlete_id,
        rs.score,
        ej.header,
        ej.name,
        rr.calc_score AS run_average,
        hr.best AS best_heat_average,
        rs.personnel_id,
        rs.run_result_id
      FROM ss_run_results rr
      JOIN ss_run_scores rs
        ON rr.run_result_id = rs.run_result_id
      JOIN ss_heat_results hr
        ON hr.round_heat_id = rr.round_heat_id
        AND hr.event_id = rr.event_id
        AND hr.division_id = rr.division_id
        AND hr.athlete_id = rr.athlete_id
      JOIN ss_event_judges ej
        ON rs.personnel_id = ej.personnel_id
      JOIN ss_heat_details hd
        ON hr.round_heat_id = hd.round_heat_id
        WHERE rr.event_id = $1
        AND hd.round_id = $2
      ORDER BY rr.athlete_id, rr.run_num;
      `,
      [eventId, roundId]
    );

  // 100, 127

  if (rows.length === 0) {
      return NextResponse.json({ error: 'No data for the get-division-round-heat API request' }, { status: 404 });
    }

    const scores = 2;
    
    return NextResponse.json(scores);

  }

    
  } catch (err) {
    console.error("Error fetching data for the get-division-round-heat API request", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}