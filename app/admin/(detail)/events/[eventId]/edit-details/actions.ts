'use server';

import { z } from 'zod';
import getDbPool from '@/lib/db'; // Your database pool setup
import { PoolClient } from 'pg';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Optional: if you redirect after successful update
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your auth helper

// Zod schema for validating form data
const UpdateEventSchema = z.object({
    name: z.string().min(3, "Event name must be at least 3 characters."),
    location: z.string().min(3, "Location must be at least 3 characters."),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD).")
        .refine(date => !isNaN(Date.parse(date)), { message: "Start date is not a valid date." }),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD).")
        .refine(date => !isNaN(Date.parse(date)), { message: "End date is not a valid date." }),
    discipline_id: z.string().min(1, "Please select a discipline."), // Assuming string ID like 'ALP_DH_SKI'
    // division_ids will be an array of strings (division IDs from checkboxes)
    division_ids: z.preprocess(
        (val) => (Array.isArray(val) ? val : (val ? [val] : [])), // Ensure it's an array
        z.string().array() // Array of strings
    ).optional(), // Divisions can be optional (e.g., admin deselects all)
}).refine(data => { // Cross-field validation for dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate;
}, {
    message: "End date cannot be before start date.",
    path: ["end_date"], // Associate error with the end_date field
});

// Define state structure for useActionState/useFormState
type UpdateEventSchemaFields = keyof z.infer<typeof UpdateEventSchema>;
export interface UpdateEventFormState {
    success: boolean;
    message: string; // General success or error message
    error?: string; // More specific error detail (e.g., from DB)
    fieldErrors?: Partial<Record<UpdateEventSchemaFields | 'num_rounds' | 'general', string[]>>;
    // 'num_rounds' can be used for errors related to round settings if not specific to a field
    // 'general' can be for top-level form errors not tied to a field
}

export async function updateEventAction(
    eventId: number, // This will be bound to the action by the form
    prevState: UpdateEventFormState | null, // Previous state
    formData: FormData // Data from the submitted form
): Promise<UpdateEventFormState> {

    // 1. Authorization Check
    const user = await getAuthenticatedUserWithRole();
    if (!user) {
        return { success: false, message: "Authentication required to update event." };
    }
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(user.roleName)) {
        return { success: false, message: "You do not have permission to update events." };
    }

    if (isNaN(eventId) || eventId <= 0) {
        return { success: false, message: "Invalid Event ID provided for update." };
    }
    console.log(`Server Action: updateEventAction called by ${user.email} for event ${eventId}`);

    // 2. Validate Core Form Data using Zod
    const rawCoreData = {
        name: formData.get('name'),
        location: formData.get('location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        discipline_id: formData.get('discipline_id'),
        division_ids: formData.getAll('division_ids'), // Get all selected division IDs
    };

    const validationResult = UpdateEventSchema.safeParse(rawCoreData);

    if (!validationResult.success) {
        console.warn("Update Event Validation Errors:", validationResult.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Invalid form data. Please correct the errors highlighted below.",
            fieldErrors: validationResult.error.flatten().fieldErrors as UpdateEventFormState['fieldErrors'],
        };
    }

    const validatedCoreData = validationResult.data;
    // Convert selected division_ids from form (strings) to numbers
    const selectedDivisionIdsFromForm = (validatedCoreData.division_ids || [])
        .map(idStr => parseInt(idStr, 10))
        .filter(idNum => !isNaN(idNum) && idNum > 0); // Ensure they are valid numbers

    // 3. Extract and validate num_rounds for each selected division
    const divisionsWithRoundsToSave: { division_id: number; num_rounds: number }[] = [];
    for (const divId of selectedDivisionIdsFromForm) {
        const numRoundsStr = formData.get(`num_rounds_div_${divId}`) as string | null;
        const numRounds = parseInt(numRoundsStr || '3', 10); // Default to 3 if not found or invalid

        if (isNaN(numRounds) || numRounds < 1 || numRounds > 10) {
            return {
                success: false,
                message: `Invalid number of rounds for a division. Rounds must be between 1 and 10.`,
                fieldErrors: { num_rounds: [`Invalid rounds for division ID ${divId} (must be 1-10).`] }
            };
        }
        divisionsWithRoundsToSave.push({ division_id: divId, num_rounds: numRounds });
    }
    console.log("Divisions to save with rounds:", divisionsWithRoundsToSave);

    // 4. Database Operations within a Transaction
    const pool = getDbPool();
    let client: PoolClient | null = null;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 4a. Update ss_events table
        const updateEventQuery = `
            UPDATE ss_events
            SET name = $1, location = $2, start_date = $3, end_date = $4, discipline_id = $5, status = $6
            WHERE event_id = $7;
        `;
        // Assuming status is also editable or has a default - add status to form if editable
        // For now, let's keep the existing status or set to 'Scheduled' if it implies active editing
        const currentEventStatus = (await client.query('SELECT status FROM ss_events WHERE event_id = $1', [eventId])).rows[0]?.status;

        await client.query(updateEventQuery, [
            validatedCoreData.name,
            validatedCoreData.location,
            validatedCoreData.start_date,
            validatedCoreData.end_date,
            validatedCoreData.discipline_id,
            currentEventStatus, // Or formData.get('status') if you add it to the form
            eventId
        ]);
        console.log(`Event ${eventId} core details updated.`);

        // 4b. Manage ss_event_divisions:
        // Get currently linked divisions to compare
        const currentDbLinkedDivisionsResult = await client.query('SELECT division_id FROM ss_event_divisions WHERE event_id = $1', [eventId]);
        const currentDbLinkedDivisionIds = new Set(currentDbLinkedDivisionsResult.rows.map(r => r.division_id));
        const newSelectedDivisionIdsSet = new Set(selectedDivisionIdsFromForm);

        // Divisions to delete: in currentDbLinkedDivisionIds but not in newSelectedDivisionIdsSet
        const divisionIdsToDelete = [...currentDbLinkedDivisionIds].filter(id => !newSelectedDivisionIdsSet.has(id));
        if (divisionIdsToDelete.length > 0) {
            // IMPORTANT: Before deleting from ss_event_divisions, consider dependent data in ss_round_details, etc.
            // If your DB has ON DELETE CASCADE from ss_event_divisions to ss_round_details, it's handled.
            // Otherwise, you might need to manually delete from ss_round_details first or handle this in a DB trigger.
            // For now, assuming CASCADE or manual cleanup is handled.
            const deleteDivisionsQuery = `DELETE FROM ss_event_divisions WHERE event_id = $1 AND division_id = ANY($2::int[]);`;
            await client.query(deleteDivisionsQuery, [eventId, divisionIdsToDelete]);
            console.log(`Removed divisions [${divisionIdsToDelete.join(', ')}] from event ${eventId}.`);
        }

        // Divisions to insert or update (num_rounds)
        for (const divWithRounds of divisionsWithRoundsToSave) {
            const upsertDivisionQuery = `
                INSERT INTO ss_event_divisions (event_id, division_id, num_rounds)
                VALUES ($1, $2, $3)
                ON CONFLICT (event_id, division_id)
                DO UPDATE SET num_rounds = EXCLUDED.num_rounds;
            `;
            await client.query(upsertDivisionQuery, [eventId, divWithRounds.division_id, divWithRounds.num_rounds]);
        }
        console.log(`Upserted/Updated divisions with their rounds for event ${eventId}.`);

        await client.query('COMMIT');

        // 5. Revalidation
        revalidatePath('/admin/events'); // List page
        revalidatePath(`/admin/events/${eventId}`); // Admin event dashboard
        revalidatePath(`/admin/events/${eventId}/edit-details`); // This edit page
        revalidatePath(`/events/${eventId}`); // Public event page

        console.log(`Event ${eventId} updated successfully.`);
        return { success: true, message: "Event updated successfully!" };

    } catch (error: unknown) {
        if (client) await client.query('ROLLBACK');
        console.error(`Database error updating event ${eventId}:`, error);
        const message = error instanceof Error ? error.message : "An unknown database error occurred.";
        return {
            success: false,
            message: "Failed to update event due to a database error.",
            error: message,
            fieldErrors: { general: [message] } // Assign to a general field error
        };
    } finally {
        if (client) client.release();
    }
}