import { NextResponse } from "next/server";
import getDbPool from "@/lib/db";

export async function POST(req: Request) {
  const pool = getDbPool();

  try {
    const { round_heat_id, run_num, personnel_id, score } = await req.json();

    // Step 1: Get the correct run_result_id
    const result = await pool.query(
      `SELECT run_result_id FROM ss_run_results WHERE round_heat_id = $1 AND run_num = $2`,
      [round_heat_id, run_num]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Run result not found" }, { status: 404 });
    }

    const run_result_id = result.rows[0].run_result_id;

    // Step 2: Insert into ss_run_scores
    //I changed the order of the parameters to match the database schema
    await pool.query(
      `INSERT INTO ss_run_scores (personnel_id, run_result_id, score)
       VALUES ($1, $2, $3)`,
      [personnel_id, run_result_id, score]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error saving score:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


/**The following block is an alternate that is also in progress */
// try {
//     const body = await req.json();
//     const { round_heat_id, run_num, personnel_id, score } = body;

//     if (
//       !round_heat_id ||
//       !run_num ||
//       !personnel_id ||
//       typeof score !== "number"
//     ) {
//       return NextResponse.json({ error: "Invalid input" }, { status: 400 });
//     }

//     // TODO: Replace these with actual values or lookups
//     const event_id = 1;
//     const division_id = 1;
//     const athlete_id = 1;

//     // ✅ Look up run_result_id
//     const result = await pool.query(
//       `
//       SELECT run_result_id FROM ss_run_results
//       WHERE round_heat_id = $1
//         AND event_id = $2
//         AND division_id = $3
//         AND athlete_id = $4
//         AND run_num = $5
//       `,
//       [round_heat_id, event_id, division_id, athlete_id, run_num]
//     );

//     const run_result_id = result.rows[0]?.run_result_id;
//     if (!run_result_id) {
//       return NextResponse.json(
//         { error: "Run result not found" },
//         { status: 404 }
//       );
//     }

//     // ✅ Insert score
//     await pool.query(
//       `
//       INSERT INTO ss_run_scores (run_result_id, personnel_id, score)
//       VALUES ($1, $2, $3)
//       `,
//       [run_result_id, personnel_id, score]
//     );

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error("Error saving score:", err);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }