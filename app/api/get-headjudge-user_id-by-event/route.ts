import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getDbPool();

  try {
  const eventIdParam = req.nextUrl.searchParams.get('event_id');
  if (!eventIdParam) {
    return NextResponse.json({ error: 'Missing data request head judge authentication' }, { status: 400 });
  }
  const eventId = parseInt(eventIdParam);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid request head judge authentication' }, { status: 400 });
  }

  const { rows } = await pool.query<{
    role_id: number;
  }>(
    `
    SELECT
      role_id
    FROM ss_event_personnel
    WHERE e.event_id = $1
    AND event_role = 'Head Judge'
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