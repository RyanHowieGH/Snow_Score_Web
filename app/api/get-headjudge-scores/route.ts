// app/api/get-division-round-heat/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type {
  ResultsHeatsHJDataMap,
  ResultsAthletesHJDataMap,
  RunHJData,
} from "@/lib/definitions";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  // 1) Validate query params
  const eventIdParam = req.nextUrl.searchParams.get('event_id');
  if (!eventIdParam) {
    return NextResponse.json(
      { error: 'Missing data for get-division-round-heat API request' },
      { status: 400 }
    );
  }
  const eventId = parseInt(eventIdParam, 10);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid event_id' }, { status: 400 });
  }

  const roundHeatIdParams = req.nextUrl.searchParams.getAll('round_heat_id');
  if (roundHeatIdParams.length === 0) {
    return NextResponse.json(
      { error: 'Missing round_heat_id' },
      { status: 400 }
    );
  }
  const heatIds = roundHeatIdParams.map((s) => parseInt(s, 10));
  if (heatIds.some(isNaN)) {
    return NextResponse.json(
      { error: 'round_heat_id must all be valid integers' },
      { status: 400 }
    );
  }

  try {
    // 2) Fetch flat rows from DB
    const { rows } = await pool.query<{
      round_heat_id: number;
      athlete_id: number;
      bib_num: number;
      seeding: number;
      run_num: number;
      run_result_id: number;
      personnel_id: number;
      header: string;
      name: string | null;
      score: number | null;
      run_average: number;
      best_heat_average: number;
    }>(
      `
      SELECT
        hr.round_heat_id,
        rr.athlete_id,
        er.bib_num,
        hr.seeding,
        rr.run_num,
        rr.run_result_id,
        rs.personnel_id,
        ej.header,
        ej.name,
        rs.score,
        rr.calc_score    AS run_average,
        hr.best          AS best_heat_average
      FROM ss_run_results rr
      JOIN ss_run_scores rs
        ON rr.run_result_id = rs.run_result_id
      JOIN ss_heat_results hr
        ON hr.round_heat_id = rr.round_heat_id
       AND hr.event_id     = rr.event_id
       AND hr.division_id  = rr.division_id
       AND hr.athlete_id   = rr.athlete_id
      JOIN ss_event_judges ej
        ON rs.personnel_id = ej.personnel_id
      JOIN ss_event_registrations er
        ON er.event_id    = hr.event_id
       AND er.division_id = hr.division_id
       AND er.athlete_id  = hr.athlete_id
      WHERE rr.event_id = $1
        AND rr.round_heat_id = ANY($2::int[])
      ORDER BY hr.round_heat_id, hr.seeding, rr.athlete_id, rr.run_num, rs.personnel_id;
      `,
      [eventId, heatIds]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data for that heat' },
        { status: 404 }
      );
    }

    // 3) Rebuild into ResultsHeatsHJDataMap
    const results: ResultsHeatsHJDataMap = {};

    rows.forEach((row) => {
      const {
        round_heat_id,
        athlete_id,
        bib_num,
        seeding,
        run_num,
        run_result_id,
        personnel_id,
        header,
        name,
        score,
        run_average,
        best_heat_average,
      } = row;

      // -- ensure heat bucket --
      if (!results[round_heat_id]) {
        results[round_heat_id] = { athletes: [] };
      }

      const heatBucket = results[round_heat_id];

      // -- find or create this athlete’s map --
      let athleteMap = heatBucket.athletes.find(
        (m) => Object.keys(m)[0] === String(athlete_id)
      ) as ResultsAthletesHJDataMap | undefined;

      if (!athleteMap) {
        athleteMap = {
          [athlete_id]: {
            athlete_id,
            bib_num,
            seeding,
            run_average,
            best_heat_average,
            scores: [],
          },
        };
        heatBucket.athletes.push(athleteMap);
      }

      // -- push this run into that athlete’s scores array --
      const athleteObj = athleteMap[athlete_id];
      const runEntry: RunHJData = {
        [run_num]: {
          run_result_id,
          personnel_id,
          header: header,
          name: name ?? "",
          score,
          run_average,
        },
      };
      athleteObj.scores.push(runEntry);
    });

    // 4) Return the nested map
    return NextResponse.json(results);
  } catch (err) {
    console.error("Error in get-division-round-heat:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
