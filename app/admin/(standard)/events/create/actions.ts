// app/admin/(standard)/events/create/actions.ts
'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

// Zod schema (can be the same as before, or simplified if draft needs fewer initial fields)
const CreateEventSchema = z.object({
    name: z.string().min(3, "Event name must be at least 3 characters."),
    location: z.string().min(3, "Location must be at least 3 characters."),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format.")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid start date." }),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format.")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid end date." }),
    discipline_id: z.string().min(1, "Please select a discipline."),
    division_ids: z.preprocess(
        (val) => (Array.isArray(val) ? val : (val ? [val] : [])),
        z.string().array()
            .transform(ids => ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))
            // For draft, maybe divisions are optional initially, or at least 1 is still good.
            // Adjust min if they are truly optional for draft.
            .pipe(z.number().int().array().min(1, "At least one valid division must be selected."))
    )
}).refine(data => {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate;
}, {
    message: "End date cannot be before start date.",
    path: ["end_date"],
});

type CreateEventSchemaFields = keyof z.infer<typeof CreateEventSchema>;
export interface CreateEventFormState { // Keep this state type
    success: boolean;
    message: string;
    error?: string;
    fieldErrors?: Partial<Record<CreateEventSchemaFields, string[]>>;
}

// Renamed for clarity, this action now saves as draft and redirects to athlete management
export async function saveDraftAndGoToManageAthletesAction(
    prevState: CreateEventFormState | null,
    formData: FormData
): Promise<CreateEventFormState> {

    const user = await getAuthenticatedUserWithRole();
    if (!user) return { success: false, message: "Authentication required." };
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to create events." };
    }

    const validation = CreateEventSchema.safeParse({
        name: formData.get('name'),
        location: formData.get('location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        discipline_id: formData.get('discipline_id'),
        division_ids: formData.getAll('division_ids'),
    });

    if (!validation.success) {
        return {
            success: false,
            message: "Invalid form data. Please correct the errors below.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    const { name, location, start_date, end_date, discipline_id, division_ids } = validation.data;
    const status = 'Draft'; // <<< --- KEY CHANGE: SAVE AS DRAFT --- <<<

    const pool = getDbPool();
    let client: PoolClient | null = null;
    let newEventId: number | null = null;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const insertEventQuery = `
            INSERT INTO ss_events (name, start_date, end_date, location, discipline_id, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING event_id;
        `;
        const eventResult = await client.query(insertEventQuery, [
            name, start_date, end_date, location, discipline_id, status
        ]);

        if (eventResult.rows.length > 0 && eventResult.rows[0].event_id) {
             newEventId = eventResult.rows[0].event_id;
        } else {
             throw new Error("Failed to create draft event or retrieve new event ID.");
        }

        if (newEventId && division_ids.length > 0) {
             const insertDivisionsQuery = `
                INSERT INTO ss_event_divisions (event_id, division_id)
                SELECT $1, division_id_from_list FROM unnest($2::int[]) AS division_id_from_list
                ON CONFLICT (event_id, division_id) DO NOTHING;
            `;
             await client.query(insertDivisionsQuery, [newEventId, division_ids]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client?.query('ROLLBACK');
        const message = error instanceof Error ? error.message : "Unknown database error occurred.";
        return { success: false, message: `Database error: ${message}` };
    } finally {
        if (client) client.release();
    }

    if (newEventId) {
        revalidatePath('/admin/events'); // Revalidate list of events
        // Revalidate the new athlete management page path
        revalidatePath(`/admin/events/${newEventId}/manage-athletes`);
        console.log(`Draft event created. Redirecting to /admin/events/${newEventId}/manage-athletes`);
        // <<< --- KEY CHANGE: REDIRECT TO MANAGE ATHLETES PAGE --- <<<
        redirect(`/admin/events/${newEventId}/manage-athletes`);
    }

    // This success message typically won't be seen by the user due to the redirect,
    // but it's good for the state structure.
    return { success: true, message: `Draft event "${name}" started! Proceed to manage athletes.` };
}