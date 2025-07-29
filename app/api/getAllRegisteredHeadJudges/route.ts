import { NextResponse } from 'next/server';
import getDbPool from '@/lib/db';

export async function GET() {
  const pool = getDbPool();
  try {
    const result = await pool.query(
      `SELECT user_id, first_name, last_name, email, role_id 
       FROM ss_users 
       WHERE role_id = 5`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Error fetching head judges:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}