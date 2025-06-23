import { NextRequest, NextResponse } from 'next/server';
import getDbPool from '@/lib/db';
import type { PoolClient } from 'pg';

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { eventId, personnelId } = body;

  if (isNaN(Number(eventId)) || !personnelId) {
    console.error("deleteJudgeFromEvent: Invalid parameters for deleting judge.");
    return NextResponse.json(
      { error: 'Invalid parameters', customError: true },
      { status: 400 }
    );
  }

  const pool = getDbPool();
  let client: PoolClient | null = null;

  try {
    client = await pool.connect();
    const result = await client.query(
      `DELETE FROM ss_event_judges WHERE event_id = $1 AND personnel_id = $2`,
      [eventId, personnelId]
    );
    console.log(`Judge deleted.`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting judge from event:`, error);
    return NextResponse.json(
      { error: error.message, customError: true },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}