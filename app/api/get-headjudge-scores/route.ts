// app/api/get-division-round-heat/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type { ResultsHJDataMap, RunHJData } from "@/lib/definitions";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
    const eventIdParam = req.nextUrl.searchParams.get('event_id');
    if (!eventIdParam) {
      return NextResponse.json({ error: 'Missing data for get-division-round-heat API request' }, { status: 400 });
    }
    const eventId = parseInt(eventIdParam, 10);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event_id' }, { status: 400 });
    }

    const roundHeatIdParam = req.nextUrl.searchParams.getAll('round_heat_id');
    
    if (!roundHeatIdParam) {
      return NextResponse.json({ error: 'Missing round_heat_id or round_id' }, { status: 400 });
    }

    if (roundHeatIdParam) {
      // Check if only numbers were passed in the array of round_heat_id
      const heatIds = roundHeatIdParam.map((s) => parseInt(s, 10));
      if (heatIds.some((n) => isNaN(n))) {
        return NextResponse.json({ error: "round_heat_id must all be valid integers" }, { status: 400 });
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
        round_heat_id: number;
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
          rs.run_result_id,
          hr.round_heat_id
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
          AND rr.round_heat_id = ANY($2::int[])
        ORDER BY rr.athlete_id, rr.run_num;
        `,
        [eventId, roundHeatIdParam]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No data for that heat' }, { status: 404 });
      }

const resultsHJDataMap: ResultsHJDataMap = {};

    rows.forEach(row => {
      const {
        round_heat_id,
        run_num,
        athlete_id,
        run_average,
        best_heat_average,
        personnel_id,
        run_result_id,
        header,
        name,
        score,
      } = row;

      if (!resultsHJDataMap[round_heat_id]) {
        resultsHJDataMap[round_heat_id] = {
          athlete_id,
          run_average,
          best_heat_average,
          scores: [],
        };
      }

      const singleRun: RunHJData = {
        [run_num]: {
          run_result_id,
          personnel_id,
          header,
          name,
          score,
        },
      };

      resultsHJDataMap[round_heat_id].scores.push(singleRun);
    });

    return NextResponse.json(resultsHJDataMap);
    }

  } catch (err) {
    console.error("Error in get-division-round-heat:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
