import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type { CompetitionHJData, DivisionHJData, RoundHJData, HeadJudge } from "@/lib/definitions";

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

  const { rows } = await pool.query<{
    event_name: string;
    division_id: number;
    division_name: string;
    round_id: number;
    round_name: string;
    num_heats: number;
    round_heat_id: number;
    heat_num: number;
    num_runs: number;
    start_time: Date;
    end_time: Date;
  }>(
    `
    SELECT
      e.name           AS event_name,
      d.division_id,
      d.division_name,
      rd.round_id,
      rd.round_name,
      rd.num_heats,
      hd.round_heat_id,
      hd.heat_num,
      hd.num_runs,
      hd.start_time,
      hd.end_time
    FROM ss_events e
    JOIN ss_event_divisions ed
      ON e.event_id = ed.event_id
    JOIN ss_division d
      ON ed.division_id = d.division_id
    JOIN ss_round_details rd
      ON rd.event_id = ed.event_id
     AND rd.division_id = ed.division_id
    JOIN ss_heat_details hd
      ON hd.round_id = rd.round_id
    WHERE e.event_id = $1
    ORDER BY d.division_id, rd.round_id, hd.heat_num
    `,
    [eventId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data for the get-division-round-heat API request' }, { status: 404 });
  }

  // Build nested structure
  const competition: CompetitionHJData = {
    event_name: rows[0].event_name,
    divisions:  [],
  };

  const divisionMap = new Map<number, DivisionHJData>();

  for (const row of rows) {
    let div = divisionMap.get(row.division_id);
    if (!div) {
      div = {
        division_id:   row.division_id,
        division_name: row.division_name,
        rounds:        [],
      };
      divisionMap.set(row.division_id, div);
      competition.divisions.push(div);
    }

    let round = div.rounds.find(r => r.round_id === row.round_id);
    if (!round) {
      round = {
        round_id:   row.round_id,
        round_name: row.round_name,
        num_heats:  row.num_heats,
        heats:      [],
      };
      div.rounds.push(round);
    }

    round.heats.push({
      round_heat_id: row.round_heat_id,
      heat_num:      row.heat_num,
      num_runs:      row.num_runs,
      start_time:    row.start_time,
      end_time:      row.end_time,
    });
  }

    return NextResponse.json(competition);
    
  } catch (err) {
    console.error("Error fetching data for the get-division-round-heat API request", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}