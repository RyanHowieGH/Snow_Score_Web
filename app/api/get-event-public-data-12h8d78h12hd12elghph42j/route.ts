import { NextResponse } from 'next/server'
import getDbPool from '@/lib/db'    // ← your pool factory

// reuse a single pool across cold starts
const pool = getDbPool()

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        name,
        start_date,
        end_date,
        location,
        status
      FROM ss_events
      WHERE event_id = $1
      `,
      [eventId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rows[0])
  } catch (err: any) {
    console.error('db error', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}