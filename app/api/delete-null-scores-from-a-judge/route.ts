import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/lib/db";
import { PoolClient } from 'pg';

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
        `DELETE FROM ss_run_scores
        USING ss_run_results
        WHERE  ss_run_scores.run_result_id = ss_run_results.run_result_id
            AND    ss_run_results.event_id = $1
            AND ss_run_scores.personnel_id = $2
            AND        ss_run_scores.score IS NULL;`,
        [eventId, personnelId]
        );
        console.log(`Judge's future runs were deleted.`);
        return NextResponse.json(result, { status: 200 });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any 
        catch (error: any) {
            console.error(`Error deleting remaining/future runs for a judge that was deleted.`, error);
            return NextResponse.json(
            { error: error.message, customError: true },
            { status: 500 }
            );
        } finally {
            if (client) client.release();
        }
}