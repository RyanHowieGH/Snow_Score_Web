import { NextRequest, NextResponse } from 'next/server';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';

interface RequestBody {
    user_id: number;
}

// Define the shape of the resolved params
interface ResolvedRouteParams {
    eventId: string;
}

// Define the context type to match what the internal checker seems to expect
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ApiRouteContext {
    params: Promise<ResolvedRouteParams>; // Make params a Promise here for the type checker
}

export async function POST(
    req: NextRequest,
    // Use a more generic type for the second argument initially to see if it bypasses the check,
    // or use the ApiRouteContext if needed.
    // The issue is with how Next.js's type checker *validates* the second argument against its
    // internal `RouteContext` which has `params: Promise<...>`.
    // Let's try to make our function signature's second argument's `params` prop explicitly a Promise.
    // This is unusual for API routes but might satisfy the build error.
    context: { params: Promise<{ eventId: string }> } // Directly match the problematic expectation
) {
    // Await the params, even though for API routes they are usually direct.
    // This is to align with the type error.
    const resolvedParams = await context.params;
    const eventIdString = resolvedParams.eventId;
    const eventId = Number(eventIdString);

    if (isNaN(eventId)) {
        return NextResponse.json({ error: 'Invalid event ID in URL path' }, { status: 400 });
    }

    let requestBody: RequestBody;
    try {
        requestBody = await req.json();
    } 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (e) {
        return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { user_id } = requestBody;

    if (typeof user_id !== 'number' || isNaN(user_id)) {
        return NextResponse.json({ error: 'Missing or invalid user_id in request body (must be a number)' }, { status: 400 });
    }

    console.log(`API: replaceHeadJudge for eventId: ${eventId}, new head_judge_user_id: ${user_id}`);

    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const deleteOldQuery = `
            DELETE FROM ss_event_personnel
            WHERE event_id = $1
              AND LOWER(event_role) IN ('head judge', 'headjudge');
        `;
        await client.query(deleteOldQuery, [eventId]);
        console.log(`Cleared existing head judge assignments for event ${eventId}.`);

        const insertNewQuery = `
            INSERT INTO ss_event_personnel (event_id, user_id, event_role)
            VALUES ($1, $2, 'Head Judge')
            ON CONFLICT (event_id, user_id) DO UPDATE
              SET event_role = EXCLUDED.event_role;
        `;
        await client.query(insertNewQuery, [eventId, user_id]);
        console.log(`Assigned user ${user_id} as Head Judge for event ${eventId}.`);

        await client.query('COMMIT');

        revalidatePath(`/admin/events/${eventId}`);
        revalidatePath(`/events/${eventId}`);

        return NextResponse.json({ success: true, message: `User ${user_id} successfully assigned as Head Judge for event ${eventId}.` });

    } catch (err: unknown) {
        if (client) await client.query('ROLLBACK');
        console.error('Error updating head judge:', err);
        const message = err instanceof Error ? err.message : "Internal server error during head judge update.";
        return NextResponse.json({ error: "Server error processing request.", details: message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}