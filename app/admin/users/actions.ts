// app/admin/users/actions.ts
'use server';

import { z } from 'zod';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Your helper to get user + role
import { revalidatePath } from 'next/cache';
import { clerkClient } from '@clerk/nextjs/server';

// Schema for validating the creation form data
const CreateUserFormSchema = z.object({
    email: z.string().email("Invalid email address."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    roleId: z.coerce.number().int().min(1, "Invalid role selected."), // Coerce string from form select to number
});

interface ActionResult {
    success: boolean;
    message: string;
    error?: string;
    fieldErrors?: Partial<Record<keyof z.infer<typeof CreateUserFormSchema>, string[]>>;
}

// --- Server Action to Create User ---
export async function createUserAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {

    // 1. Authorization Check
    const callingUser = await getAuthenticatedUserWithRole();
    if (!callingUser) {
        return { success: false, message: "Authentication required.", error: "Unauthorized" };
    }
    // Define allowed roles for creating users
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition']; // Add roles as needed
    if (!allowedRoles.includes(callingUser.roleName)) {
        return { success: false, message: "You do not have permission to create users.", error: "Forbidden" };
    }

    // 2. Validate Form Data
    const validation = CreateUserFormSchema.safeParse({
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        roleId: formData.get('roleId'),
    });

    if (!validation.success) {
        console.log("Validation Errors:", validation.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Invalid form data.",
            error: "Validation failed.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    const { email, firstName, lastName, roleId } = validation.data;

    // 3. Prevent creating higher/equal privileged roles (Example Check)
    if (roleId === 1 && callingUser.roleName !== 'Executive Director') {
        return { success: false, message: "Only the Executive Director can create another Executive Director.", error: "Forbidden" };
    }
    if (roleId === 2 && !['Executive Director'].includes(callingUser.roleName)) {
         return { success: false, message: "Only the Executive Director can create Administrators.", error: "Forbidden" };
    }
     if (roleId === 3 && !['Executive Director', 'Administrator'].includes(callingUser.roleName)) {
         return { success: false, message: "Only Exec Director or Admin can create Chief of Competition.", error: "Forbidden" };
    }
    // Add more checks as needed based on your hierarchy


    try {
        console.log(`Admin ${callingUser.email} attempting to create user: ${email}`);

        // 4. Call Clerk Backend API to create the user
        // Clerk handles sending invitations or password setup emails based on your instance settings
        const client = await clerkClient(); // Get the actual client instance
        const newUser = await client.users.createUser({ // Use the instance
            emailAddress: [email],
            firstName: firstName,
            lastName: lastName,
            // If passing role metadata to webhook:
            // publicMetadata: { initial_role_id: roleId }
            // We CANNOT set the password directly here usually. Clerk manages that.
            // We will assign the role via the webhook using a default, then update it.
            // OR, you could pass the intended roleId via publicMetadata if webhook reads it.
            // publicMetadata: { initial_role_id: roleId } // Example if webhook supports this
        });

        console.log(`User created successfully in Clerk with ID: ${newUser.id}`);

        // 5. Linking & Role Assignment - IMPORTANT!
        // This action DOES NOT directly insert into ss_users.
        // The `user.created` webhook handler in `/api/webhooks/clerk/route.ts`
        // MUST be configured correctly to:
        //   a) Receive the event for `newUser.id`.
        //   b) Insert the record into `ss_users`, linking `auth_provider_user_id` to `newUser.id`.
        //   c) Assign the *intended* `roleId` (instead of default). This is the tricky part.

        // --- How to pass intended role to webhook? ---
        // Option 1 (Metadata - Recommended if possible): Check if your webhook handler can
        // access `publicMetadata` set during creation. If so, set it above and read it in the webhook.
        // Option 2 (Update After Creation): Add logic here *after* Clerk confirms creation,
        // to query `ss_users` for the new `auth_provider_user_id` (maybe poll briefly or assume webhook runs fast)
        // and then UPDATE the `role_id` to the intended one. This is less clean.
        // Option 3 (Admin UI Update): Simplest - Webhook assigns DEFAULT role. Admin uses a separate
        // UI function (e.g., an "Edit User" button on a user list) to set the correct role later.

        // Assuming Option 3 (or Option 1 handled by webhook) for now.

        revalidatePath('/admin/users'); // Revalidate path if you have a user list page
        return { success: true, message: `User ${email} created. Initial setup email sent by Clerk. Role assigned via webhook/needs update.` };

    } catch (error: any) {
        console.error("Error creating user via Clerk API:", error);
        // Handle specific Clerk errors (e.g., email already exists)
        let errorMessage = "Failed to create user.";
        if (error.errors && error.errors.length > 0) {
             errorMessage = error.errors[0].longMessage || error.errors[0].message || errorMessage;
             // Check for specific error codes if needed
             if (error.errors[0].code === 'duplicate_record') {
                 errorMessage = `A user with email ${email} already exists.`
             }
        }
        return { success: false, message: errorMessage, error: "API Error" };
    }
}

// --- Placeholder for future Update User Role Action ---
export async function updateUserRoleAction(userId: number, newRoleId: number): Promise<ActionResult> {
     'use server';
     // 1. Authorization Check (similar to create)
     // 2. Validation (ensure role ID is valid)
     // 3. Check role hierarchy (can user X change user Y to role Z?)
     // 4. UPDATE ss_users SET role_id = $1 WHERE user_id = $2
     // 5. Revalidate paths
     console.log(`Placeholder: Update user ${userId} to role ${newRoleId}`);
     return { success: true, message: "Role update not fully implemented."};
}

// --- Placeholder for future Delete User Action ---
export async function deleteUserAction(clerkUserIdToDelete: string): Promise<ActionResult> {
     'use server';
     // 1. Authorization Check (who can delete whom?)
     // 2. Call clerkClient.users.deleteUser(clerkUserIdToDelete)
     // 3. Rely on webhook or FK constraint for ss_users cleanup.
     // 4. Revalidate paths
      console.log(`Placeholder: Delete user ${clerkUserIdToDelete}`);
      return { success: true, message: "User deletion not fully implemented."};
}