import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

type athletesHeatData = {
    athlete_name: string,
    athlete_id: number,
    bib_num: number,
    run_num: number,
    seeding: number,
    run_result_id: number,
    round_heat_id: number
}

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
    const eventIdParam = req.nextUrl.searchParams.get("event_id");
    if (!eventIdParam) {
      return NextResponse.json(
        { error: "Missing the event identifier" },
        { status: 400 }
      );
    }

    const eventId = parseInt(eventIdParam, 10);

    const athletesResult = await pool.query<athletesHeatData>(
      `
      SELECT
        a.first_name || ' ' || a.last_name    AS athlete_name,
        rr.athlete_id,
        reg.bib_num,
        rr.run_num,
        hr.seeding,
        rr.run_result_id,
        rr.round_heat_id
        FROM ss_run_results   rr
        JOIN ss_event_registrations reg 
        ON rr.event_id    = reg.event_id
        AND rr.division_id = reg.division_id
        AND rr.athlete_id  = reg.athlete_id
        JOIN ss_athletes     a  
        ON a.athlete_id    = rr.athlete_id
        JOIN ss_heat_results hr
            ON rr.round_heat_id = hr.round_heat_id
            AND rr.athlete_id = hr.athlete_id
        JOIN ss_run_scores   rs 
        ON rr.run_result_id = rs.run_result_id
        JOIN ss_event_judges ej 
        ON rs.personnel_id  = ej.personnel_id
        WHERE rr.event_id = 100
        GROUP BY
        rr.athlete_id,
        reg.bib_num,
        rr.round_heat_id,
        a.first_name,
        a.last_name,
        rr.run_num,
        rr.run_result_id,
        hr.seeding
        ORDER BY hr.seeding;
      `,
      [eventId]
    );

    const rows = athletesResult.rows;
    const athletesHeatData: athletesHeatData[] = rows.map(({ athlete_name, athlete_id, bib_num, run_num, seeding, run_result_id, round_heat_id }) => ({
      athlete_name,
      athlete_id,
      bib_num,
      run_num,
      seeding,
      run_result_id,
      round_heat_id
    }));

    return NextResponse.json(athletesHeatData);
    
  } catch (err) {
    console.error("Error fetching athletes heat data:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}