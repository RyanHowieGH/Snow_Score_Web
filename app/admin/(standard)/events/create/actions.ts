// app/admin/events/create/actions.ts
'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // For authorization

// Zod schema for validating form data (including division_ids)
const CreateEventSchema = z.object({
    name: z.string().min(3, "Event name must be at least 3 characters."),
    location: z.string().min(3, "Location must be at least 3 characters."),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format.")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid start date." }),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format.")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid end date." }),
    discipline_id: z.string().min(1, "Please select a discipline."),
    division_ids: z.preprocess( // Handle single or multiple checkbox values
        (val) => (Array.isArray(val) ? val : (val ? [val] : [])),
        z.string({ message: "Invalid division ID format." }) // Input values are strings
            .array()
            .min(1, "Please select at least one division.")
            // Convert to numbers and filter out failures
            .transform(ids => ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))
            // Ensure at least one valid number remains
            .pipe(z.number({invalid_type_error: "Division ID must be a number."}).int().array().min(1, "At least one valid division must be selected."))
    )
}).refine(data => { // Cross-field validation for dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    // Check dates are valid before comparing
    return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate;
}, {
    message: "End date cannot be before start date.",
    path: ["end_date"], // Associate error with the end_date field
});

// Define state structure for useActionState/useFormState
// Use the schema's inferred type keys for fieldErrors
type CreateEventSchemaFields = keyof z.infer<typeof CreateEventSchema>;
export interface CreateEventFormState {
    success: boolean;
    message: string;
    error?: string; // General non-field error message
    fieldErrors?: Partial<Record<CreateEventSchemaFields, string[]>>; // Errors specific to form fields
}

// --- Server Action to Create Event ---
export async function createEventAction(
    prevState: CreateEventFormState | null, // Previous state from useActionState
    formData: FormData // Data from the submitted form
): Promise<CreateEventFormState> { // Return type must match state structure

    // 1. Authorization Check
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required." };
    }
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to create events." };
    }

    // 2. Validate Form Data using the Zod schema
    const validation = CreateEventSchema.safeParse({
        name: formData.get('name'),
        location: formData.get('location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        discipline_id: formData.get('discipline_id'),
        division_ids: formData.getAll('division_ids'), // Use getAll to capture all checked values
    });

    // Handle validation failure by returning state with errors
    if (!validation.success) {
        console.log("Create Event Validation Errors:", validation.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Invalid form data. Please correct the errors below.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    // Extract validated data
    const { name, location, start_date, end_date, discipline_id, division_ids } = validation.data;
    const status = 'Scheduled'; // Default status for new events

    // 3. Database Insert within a Transaction
    const pool = getDbPool();
    let client: PoolClient | null = null;
    let newEventId: number | null = null;

    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Start transaction

        // 3a. Insert into ss_events
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
             console.log(`Event created successfully with ID: ${newEventId}, Status: ${status}`);
        } else {
             throw new Error("Failed to create event or retrieve new event ID.");
        }

        // 3b. Insert into ss_event_divisions (only if event created and divisions selected)
        if (newEventId && division_ids.length > 0) {
             const insertDivisionsQuery = `
                INSERT INTO ss_event_divisions (event_id, division_id)
                SELECT $1, division_id_from_list
                FROM unnest($2::int[]) AS division_id_from_list -- Use unnest with integer array
                ON CONFLICT (event_id, division_id) DO NOTHING; -- Ignore duplicates
            `;
             const divisionResult = await client.query(insertDivisionsQuery, [newEventId, division_ids]);
             console.log(`Linked ${divisionResult.rowCount ?? 0} divisions to event ${newEventId}.`);
        } else if (!newEventId) {
             console.error("Cannot link divisions because event ID was not obtained.");
        } else {
             console.log(`No divisions selected for event ${newEventId}.`);
        }

        await client.query('COMMIT'); // Commit transaction

    } catch (error) {
        await client?.query('ROLLBACK'); // Rollback on error
        console.error("Database error during event creation/division linking:", error);
        const message = error instanceof Error ? error.message : "Unknown database error occurred.";
        return { success: false, message: `Database error: ${message}` };
    } finally {
        if (client) client.release(); // Ensure client is always released
    }

    // 4. Post-Creation Actions (Revalidation & Redirect)
    revalidatePath('/admin/events'); // Revalidate the event list page URL
    if (newEventId) {
         revalidatePath(`/admin/events/${newEventId}`); // Revalidate the specific event page URL
         console.log(`Redirecting to /admin/events/${newEventId}`);
         redirect(`/admin/events/${newEventId}`); // Redirect on success
    }
    return { success: true, message: `Event "${name}" created successfully!` };

} // End of createEventAction