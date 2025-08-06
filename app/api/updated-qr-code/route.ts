import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import type { JudgingPanelPerEvent } from "@/lib/definitions";

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

    const eventId = parseInt(eventIdParam);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event_id" }, { status: 400 });
    }

    const result = await pool.query<JudgingPanelPerEvent>(
      `
        SELECT DISTINCT
          rd.event_id,
          rd.division_id,
          d.division_name,
          rd.round_id,
          hd.heat_num,
          hd.round_heat_id,
          ej.personnel_id,
          ej.header AS judge_header,
          ej.name AS judge_name,
          e.name,
          ej.passcode,
          rd.round_name
        FROM   ss_round_details   rd
        JOIN   ss_heat_details    hd ON rd.round_id = hd.round_id
        JOIN   ss_heat_results    hr ON hr.round_heat_id = hd.round_heat_id
        JOIN   ss_event_divisions ed ON ed.division_id = rd.division_id            
        JOIN   ss_event_judges    ej ON rd.event_id = ej.event_id
        JOIN   ss_events          e  ON e.event_id = rd.event_id
        JOIN   ss_division        d  ON ed.division_id = d.division_id
        WHERE  ej.event_id = $1;
      `,
      [eventId]
    );

    const judgingPanels: JudgingPanelPerEvent[] = result.rows.map((row) => ({
      event_id: row.event_id,
      division_id: row.division_id,
      division_name: row.division_name,
      round_id: row.round_id,
      heat_num: row.heat_num,
      round_heat_id: row.round_heat_id,
      personnel_id: row.personnel_id,
      name: row.name,
      passcode: row.passcode,
      round_name: row.round_name,
      judge_name: row.judge_name,
      judge_header: row.judge_header,
    }));

    return NextResponse.json(judgingPanels);
  } catch (error) {
    console.error("Database error retrieving judging panel data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
