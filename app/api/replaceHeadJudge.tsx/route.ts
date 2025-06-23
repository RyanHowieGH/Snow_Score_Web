import { NextResponse } from 'next/server';
import getDbPool from '@/lib/db';

export async function POST(req: Request, { params }: { params: { eventId: string }}) {
  const eventId = Number(params.eventId);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }
  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO ss_event_personnel (event_id, user_id, event_role)
       VALUES ($1, $2, 'Head Judge')
       ON CONFLICT DO NOTHING;`,
      [eventId, user_id]
    );
    await client.query(
      `DELETE FROM ss_event_personnel
       WHERE event_id = $1
         AND LOWER(event_role) IN ('head judge','headjudge')
         AND user_id <> $2;`,
      [eventId, user_id]
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating head judge:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}