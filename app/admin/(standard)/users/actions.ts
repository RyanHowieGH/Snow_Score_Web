// app/admin/(standard)/users/actions.ts
'use server';

import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import getDbPool from '@/lib/db'; // Import pool for update action
import { PoolClient } from 'pg'; // Import client type

// --- Define a type guard for Clerk API errors ---
interface ClerkApiError {
    errors?: { // errors array is optional
        code?: string;
        longMessage?: string;
        message?: string;
        meta?: Record<string, unknown>;
    }[]; // It's an array of error objects
    status?: number;
}
interface ClerkApiErrorItem { // Interface for a single error object
    code?: string;
    longMessage?: string;
    message?: string;
    meta?: Record<string, unknown>;
}

export interface CreateUserFormState { // Defined and EXPORTED here
    success: boolean;
    message: string;
    tempPassword?: string;
    error?: string;
    fieldErrors?: Partial<Record<keyof z.infer<typeof CreateUserFormSchema>, string[]>>;
}
function isClerkApiError(error: unknown): error is ClerkApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        // Check if 'errors' exists and is an array (or could be undefined)
        ('errors' in error && (Array.isArray(error.errors) || typeof error.errors === 'undefined'))
    );
}
// --- End type guard ---


// Schema for validating the creation form data
const CreateUserFormSchema = z.object({
    email: z.string().email("Invalid email address."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    roleId: z.coerce.number().int().min(1, "Invalid role selected."),
});

// Define Action Result state for all actions in this file
// Includes optional tempPassword for create success
export interface UserActionResult {
    success: boolean;
    message: string;
    tempPassword?: string;
    error?: string; // General error message or code
    // Use the actual schema field names for field errors
    fieldErrors?: Partial<Record<keyof z.infer<typeof CreateUserFormSchema>, string[]>>;
}

// --- Server Action to Create User with Temporary Password ---
export async function createUserAction(
    prevState: UserActionResult | null,
    formData: FormData
): Promise<UserActionResult> {
    const uniqueRequestId = `ACTION-${Date.now()}`;

    // 1. Authorization Check
    const callingUser = await getAuthenticatedUserWithRole();
    if (!callingUser) {
        return { success: false, message: "Authentication required.", error: "Unauthorized" };
    }
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
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

    // 3. Prevent creating higher/equal privileged roles
    if (roleId === 1 && callingUser.roleName !== 'Executive Director') return { success: false, message: "Only the Executive Director can create another Executive Director.", error: "Forbidden" };
    if (roleId === 2 && !['Executive Director'].includes(callingUser.roleName)) return { success: false, message: "Only the Executive Director can create Administrators.", error: "Forbidden" };
    if (roleId === 3 && !['Executive Director', 'Administrator'].includes(callingUser.roleName)) return { success: false, message: "Only Exec Director or Admin can create Chief of Competition.", error: "Forbidden" };

    // 4. Generate Temporary Password
    const tempPassword = crypto.randomBytes(10).toString('base64url').slice(0, 10);
    console.log(`Generated temporary password for ${email}: ${tempPassword}`);

    try {
        console.log(`Admin ${callingUser.email} attempting to create user: ${email} with initial password.`);
        console.log(`[${uniqueRequestId}] Admin ${callingUser.email} attempting to create user: ${email}`);

        // 5. Call Clerk Backend API
        const client = await clerkClient(); // Get client instance
        const newUser = await client.users.createUser({
            emailAddress: [email.toLowerCase()],
            firstName: firstName,
            lastName: lastName,
            password: tempPassword,
            publicMetadata: { initial_role_id: roleId } // Pass role for webhook
        });

        console.log(`User created successfully in Clerk with ID: ${newUser.id}`);
        console.log(`[${uniqueRequestId}] User created successfully in Clerk. Response ID: ${newUser.id}`);

        // 6. Linking & Role Assignment (Handled by Webhook)

        revalidatePath('/admin/users');
        return {
            success: true,
            message: `User ${email} created. Role assignment relies on webhook.`,
            tempPassword: tempPassword
        };

    } catch (error: unknown) { // Use unknown type
        console.error(`[${uniqueRequestId}] Error creating user via Clerk API:`, error);

        console.error("Error creating user via Clerk API:", error);
        let errorMessage = "Failed to create user.";
        let clerkErrorCode: string | undefined = undefined;

         // --- Use Type Guard ---
         if (isClerkApiError(error) && error.errors && error.errors.length > 0) {
            const clerkErrors = error.errors;
            console.error("Detailed Clerk Errors:", JSON.stringify(clerkErrors, null, 2));
            const firstError = clerkErrors[0];
            errorMessage = firstError.longMessage || firstError.message || errorMessage;
            clerkErrorCode = firstError.code;
            if (clerkErrorCode === 'duplicate_record' || errorMessage.includes('is taken')) { /*...*/ }
            if (clerkErrorCode === 'form_data_missing' && firstError.longMessage?.includes('password')) { /*...*/ }
       } else if (error instanceof Error) { // Fallback for generic errors
            errorMessage = error.message;
       }
       // --- End Type Guard Usage ---
        return { success: false, message: errorMessage, error: clerkErrorCode || "API Error" };
    }
}

// --- Update User Role Action ---
export async function updateUserRoleAction(userId: number, newRoleId: number): Promise<UserActionResult> {
     'use server';
     console.log(`Placeholder: Update ss_users.user_id ${userId} to role_id ${newRoleId}`);

     // 1. Authorization Check
     const callingUser = await getAuthenticatedUserWithRole();
     if (!callingUser) {
         return { success: false, message: "Authentication required.", error: "Unauthorized" };
     }
     console.warn("updateUserRoleAction: Authorization logic not fully implemented!");

     // 2. Validation (e.g., check if newRoleId is valid)
     const pool = getDbPool();
     let client: PoolClient | null = null;
     try {
         client = await pool.connect();
         const roleCheck = await client.query('SELECT 1 FROM ss_roles WHERE role_id = $1', [newRoleId]);
         if (roleCheck.rowCount === 0) {
              return { success: false, message: `Invalid target role ID: ${newRoleId}`, error: "Validation Failed" };
         }

         // 3. UPDATE ss_users table
         const updateQuery = 'UPDATE ss_users SET role_id = $1 WHERE user_id = $2';
         const result = await client.query(updateQuery, [newRoleId, userId]);

         if (result.rowCount === 1) {
             revalidatePath('/admin/users'); // Revalidate the user list
             return { success: true, message: "User role updated successfully." };
         } else {
              return { success: false, message: `User with ID ${userId} not found.`, error: "Not Found"};
         }
     } catch (error: unknown) { // Use unknown type
          console.error(`Error updating role for user ID ${userId}:`, error);
          // Use type guard
          const message = error instanceof Error ? error.message : "Unknown database error.";
          return { success: false, message: `Database error: ${message}`, error: "DB Error" };
     } finally {
          if (client) client.release();
     }
}

// --- Delete User Action ---
export async function deleteUserAction(clerkUserIdToDelete: string, dbUserIdToDelete: number): Promise<UserActionResult> {
     'use server';

     // 1. Authorization Check (Your existing code is perfect)
     const callingUser = await getAuthenticatedUserWithRole();
     if (!callingUser) return { success: false, message: "Authentication required.", error: "Unauthorized" };
     const allowedDeleteRoles = ['Executive Director', 'Administrator'];
     if (!allowedDeleteRoles.includes(callingUser.roleName)) {
         return { success: false, message: "You do not have permission to delete users.", error: "Forbidden" };
     }
     if (callingUser.authProviderId === clerkUserIdToDelete) {
         return { success: false, message: "Cannot delete your own account.", error: "Forbidden" };
     }

     console.log(`User ${callingUser.email} attempting to delete Clerk user ID: ${clerkUserIdToDelete}`);

     try {
         // --- VVV NEW: Explicitly delete from your local DB first VVV ---
         // It's often safer to delete from your own DB first. If this fails,
         // the user still exists in Clerk and no harm is done.
         // If you delete from Clerk first and the DB delete fails, you have an "orphan" record.
         const pool = getDbPool();
         const deleteDbResult = await pool.query('DELETE FROM ss_users WHERE user_id = $1', [dbUserIdToDelete]);

         if (deleteDbResult.rowCount === 0) {
            // This is a safety check in case the user was already deleted from the DB
            console.warn(`Attempted to delete user from DB with ID ${dbUserIdToDelete}, but they were not found.`);
         }
         // --- ^^^ END OF DB DELETION ---

         // 2. Call Clerk API to delete the user
         const client = await clerkClient();
         await client.users.deleteUser(clerkUserIdToDelete);
         console.log(`Successfully deleted user ${clerkUserIdToDelete} from Clerk and local database.`);

         // 3. Revalidate the path to refresh the UI
         revalidatePath('/admin/users');
         return { success: true, message: "User deleted successfully." };

     } catch (error: unknown) {
         console.error(`Error deleting user ${clerkUserIdToDelete}:`, error);
         // ... (Your excellent error handling logic remains the same) ...
         let errorMessage = "Failed to delete user.";
         let clerkErrorCode: string | undefined = undefined;
         if (isClerkApiError(error) && error.errors && error.errors.length > 0) {
            const clerkErrors = error.errors;
            const firstError: ClerkApiErrorItem = clerkErrors[0];
            errorMessage = firstError.longMessage || firstError.message || errorMessage;
            clerkErrorCode = firstError.code;
            if (clerkErrorCode === 'resource_not_found') {
                errorMessage = "User not found in Clerk (might be already deleted).";
            }
         } else if (error instanceof Error) {
           errorMessage = error.message;
         }
         return { success: false, message: errorMessage, error: clerkErrorCode || "API Error" };
     }
}