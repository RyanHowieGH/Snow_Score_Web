// app/admin/events/create/actions.ts
'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // For authorization

// Zod schema for validating form data (status removed)
const CreateEventSchema = z.object({
    name: z.string().min(3, "Event name must be at least 3 characters."),
    location: z.string().min(3, "Location must be at least 3 characters."),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD).")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid start date." }), // Check if parsable
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD).")
        .refine(date => !isNaN(Date.parse(date)), { message: "Invalid end date." }), // Check if parsable
    discipline_id: z.string().min(1, "Please select a discipline."),
}).refine(data => {
    // Ensure dates are valid before comparing
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate;
}, {
    message: "End date cannot be before start date.",
    path: ["end_date"], // Associate error with end_date field
});

// Define state structure for useActionState/useFormState
// Define field keys based on the FINAL schema keys used in safeParse
type CreateEventSchemaFields = keyof Omit<z.infer<typeof CreateEventSchema>, 'status'>; // Omit status if not in schema
export interface CreateEventFormState {
    success: boolean;
    message: string;
    error?: string; // General error message
    fieldErrors?: Partial<Record<CreateEventSchemaFields, string[]>>; // Errors for specific fields
}

// --- Server Action to Create Event ---
export async function createEventAction(
    // Previous state (can be null on first render)
    prevState: CreateEventFormState | null,
    // Form data submitted
    formData: FormData
): Promise<CreateEventFormState> { // Return type matches state structure

    // 1. Authorization Check
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required." };
    }
    // Define roles allowed to create events
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to create events." };
    }

    // 2. Validate Form Data using Zod schema
    const validation = CreateEventSchema.safeParse({
        name: formData.get('name'),
        location: formData.get('location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        discipline_id: formData.get('discipline_id'),
    });

    // Handle validation failure
    if (!validation.success) {
        console.log("Create Event Validation Errors:", validation.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Invalid form data. Please correct the errors below.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    // Extract validated data
    const { name, location, start_date, end_date, discipline_id } = validation.data;
    const status = 'Scheduled'; // Default status

    // 3. Database Insert
    const pool = getDbPool();
    let client: PoolClient | null = null;
    let newEventId: number | null = null;

    try {
        client = await pool.connect();
        const insertQuery = `
            INSERT INTO ss_events (name, start_date, end_date, location, discipline_id, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING event_id;
        `;
        const result = await client.query(insertQuery, [
            name, start_date, end_date, location, discipline_id, status
        ]);

        if (result.rows.length > 0 && result.rows[0].event_id) {
             newEventId = result.rows[0].event_id;
             console.log(`Event created successfully with ID: ${newEventId}, Status: ${status}`);
        } else {
             // This case should ideally not happen if INSERT is successful, but good to handle
             throw new Error("Database did not return a new event ID after insertion.");
        }

    } catch (error) {
        console.error("Database error creating event:", error);
        const message = error instanceof Error ? error.message : "Unknown database error occurred.";
        // Consider more specific DB error checking if needed (e.g., unique constraints)
        return { success: false, message: `Database error: ${message}` };
    } finally {
        if (client) client.release();
    }

    // 4. Post-Creation Actions (Revalidation & Redirect)
    // Revalidate relevant paths to show the new event
    revalidatePath('/events'); // Event list page
    revalidatePath('/admin'); // Maybe admin dashboard if it shows event count etc.

    if (newEventId) {
         // Redirect to the newly created event's dashboard page
         console.log(`Redirecting to /admin/events/${newEventId}`);
         redirect(`/admin/events/${newEventId}`);
         // Code execution stops here due to redirect
    } else {
         // Should not happen if DB insert was successful, but handle defensively
         return { success: false, message: "Event created but failed to get ID for redirect." };
    }

    // This success message might not be seen by the user due to the immediate redirect,
    // but it's good practice to return the final state.
    // A "flash message" system could be used for post-redirect messages.
    // return { success: true, message: `Event "${name}" created successfully!` };

} // End of createEventAction