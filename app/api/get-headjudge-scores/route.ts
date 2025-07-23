// app/api/get-division-round-heat/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type { ScoresHJData, ScoresPerRunHJData } from "@/lib/definitions";

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

    const roundHeatIdParam = req.nextUrl.searchParams.get('round_heat_id');
    const roundIdParam     = req.nextUrl.searchParams.get('round_id');
    if (!roundHeatIdParam && !roundIdParam) {
      return NextResponse.json({ error: 'Missing round_heat_id or round_id' }, { status: 400 });
    }

    const baseQuery = `
      SELECT
        rr.run_num,
        rr.athlete_id,
        rs.score,
        ej.header,
        ej.name,
        rr.calc_score       AS run_average,
        hr.best             AS best_heat_average,
        rs.personnel_id,
        rs.run_result_id
      FROM ss_run_results rr
      JOIN ss_run_scores   rs ON rr.run_result_id = rs.run_result_id
      JOIN ss_heat_results hr
        ON hr.round_heat_id = rr.round_heat_id
       AND hr.event_id      = rr.event_id
       AND hr.division_id   = rr.division_id
       AND hr.athlete_id    = rr.athlete_id
      JOIN ss_event_judges ej ON rs.personnel_id = ej.personnel_id
    `;

    // 1) Specific heat
    if (roundHeatIdParam) {
      const rhId = parseInt(roundHeatIdParam, 10);
      if (isNaN(rhId)) {
        return NextResponse.json({ error: 'Invalid round_heat_id' }, { status: 400 });
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
        baseQuery + `
        WHERE rr.event_id = $1
          AND rr.round_heat_id = $2
        ORDER BY rr.athlete_id, rr.run_num;
        `,
        [eventId, rhId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No data for that heat' }, { status: 404 });
      }

      const mapSingle = new Map<number, ScoresHJData>();
      for (const r of rows) {
        let entry = mapSingle.get(r.athlete_id);
        if (!entry) {
          entry = {
            athlete_id:       r.athlete_id,
            run_average:      r.run_average,
            best_heat_average:r.best_heat_average,
            scores:           []
          };
          mapSingle.set(r.athlete_id, entry);
        }
        entry.scores.push({
          run_result_id: r.run_result_id,
          personnel_id:  r.personnel_id,
          header:        r.header,
          name:          r.name,
          run_num:       r.run_num,
          score:         r.score
        });
      }
      const scoresForASingleHeat = Array.from(mapSingle.values());
      return NextResponse.json(scoresForASingleHeat);
    }

    // Every heat in a round
    if (roundIdParam) {
      const rId = parseInt(roundIdParam, 10);
      if (isNaN(rId)) {
        return NextResponse.json({ error: 'Invalid round_id' }, { status: 400 });
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
        baseQuery + `
        JOIN ss_heat_details hd 
          ON hr.round_heat_id = hd.round_heat_id
        WHERE rr.event_id = $1
          AND hd.round_id  = $2
        ORDER BY rr.athlete_id, rr.round_heat_id, rr.run_num;
        `,
        [eventId, rId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No data for that round' }, { status: 404 });
      }

      const mapMulti = new Map<number, ScoresHJData>();
      for (const r of rows) {
        let entry = mapMulti.get(r.athlete_id);
        if (!entry) {
          entry = {
            athlete_id:       r.athlete_id,
            run_average:      r.run_average,
            best_heat_average:r.best_heat_average,
            scores:           []
          };
          mapMulti.set(r.athlete_id, entry);
        }
        entry.scores.push({
          run_result_id: r.run_result_id,
          personnel_id:  r.personnel_id,
          header:        r.header,
          name:          r.name,
          run_num:       r.run_num,
          score:         r.score
        });
      }
      const scoresForMultipleHeats = Array.from(mapMulti.values());
      return NextResponse.json(scoresForMultipleHeats);
    }

  } catch (err) {
    console.error("Error in get-division-round-heat:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
