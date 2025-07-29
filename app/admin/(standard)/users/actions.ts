'use server';

import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';

// --- Type Guards and Interfaces ---
interface ClerkApiError {
    errors?: {
        code?: string;
        longMessage?: string;
        message?: string;
        meta?: Record<string, unknown>;
    }[];
    status?: number;
}
interface ClerkApiErrorItem {
    code?: string;
    longMessage?: string;
    message?: string;
    meta?: Record<string, unknown>;
}
function isClerkApiError(error: unknown): error is ClerkApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        ('errors' in error && (Array.isArray(error.errors) || typeof error.errors === 'undefined'))
    );
}

// --- Zod Schema ---
const CreateUserFormSchema = z.object({
    email: z.string().email("Invalid email address."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    roleId: z.coerce.number().int().min(1, "Invalid role selected."),
});

// --- Action Result Types ---
export interface UserActionResult {
    success: boolean;
    message: string;
    tempPassword?: string;
    error?: string;
    fieldErrors?: Partial<Record<keyof z.infer<typeof CreateUserFormSchema>, string[]>>;
}
export interface CreateUserFormState extends UserActionResult {}

// --- Create User Action ---
export async function createUserAction(prevState: UserActionResult | null, formData: FormData): Promise<UserActionResult> {
    const uniqueRequestId = `ACTION-${Date.now()}`;
    const callingUser = await getAuthenticatedUserWithRole();
    if (!callingUser) {
        return { success: false, message: "Authentication required.", error: "Unauthorized" };
    }
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!allowedRoles.includes(callingUser.roleName)) {
        return { success: false, message: "You do not have permission to create users.", error: "Forbidden" };
    }
    const validation = CreateUserFormSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validation.success) {
        return { success: false, message: "Invalid form data.", error: "Validation failed.", fieldErrors: validation.error.flatten().fieldErrors };
    }
    const { email, firstName, lastName, roleId } = validation.data;
    if (roleId <= callingUser.roleId && callingUser.roleName !== 'Executive Director') {
        return { success: false, message: "You cannot create a user with a role equal to or higher than your own.", error: "Forbidden" };
    }
    const tempPassword = crypto.randomBytes(10).toString('base64url').slice(0, 10);
    try {
        const client = await clerkClient();
        const newUser = await client.users.createUser({
            emailAddress: [email.toLowerCase()],
            firstName: firstName,
            lastName: lastName,
            password: tempPassword,
            publicMetadata: { initial_role_id: roleId }
        });
        revalidatePath('/admin/users');
        return { success: true, message: `User ${email} created. Role assignment relies on webhook.`, tempPassword: tempPassword };
    } catch (error: unknown) {
        let errorMessage = "Failed to create user.";
        if (isClerkApiError(error) && error.errors && error.errors.length > 0) {
            errorMessage = error.errors[0].longMessage || error.errors[0].message || errorMessage;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { success: false, message: errorMessage, error: "API Error" };
    }
}

// --- VVV THIS IS THE CORRECTED UPDATE USER ROLE ACTION VVV ---
export async function updateUserRoleAction(
    prevState: UserActionResult | null,
    formData: FormData
): Promise<UserActionResult> {
     'use server';
     
     // Read both IDs from the FormData object
     const userId = Number(formData.get('userId'));
     const newRoleId = Number(formData.get('newRoleId'));
     
     if (!userId || !newRoleId) {
        return { success: false, message: "Missing user or role information." };
     }

     const callingUser = await getAuthenticatedUserWithRole();
     if (!callingUser) {
         return { success: false, message: "Authentication required.", error: "Unauthorized" };
     }
     const allowedRoles = ['Executive Director', 'Administrator'];
     if (!allowedRoles.includes(callingUser.roleName)) {
        return { success: false, message: "You do not have permission to change user roles.", error: "Forbidden" };
     }
     if (userId === callingUser.appUserId) {
        return { success: false, message: "You cannot change your own role.", error: "Forbidden" };
     }
     if (newRoleId <= callingUser.roleId && callingUser.roleName !== 'Executive Director') {
        return { success: false, message: "You cannot assign a role equal to or higher than your own.", error: "Forbidden" };
     }
     
     const pool = getDbPool();
     try {
         const result = await pool.query('UPDATE ss_users SET role_id = $1 WHERE user_id = $2', [newRoleId, userId]);
         if (result.rowCount === 0) {
            return { success: false, message: "User not found in database." };
         }
         revalidatePath('/admin/users');
         return { success: true, message: "User role updated successfully." };
     } catch (error: unknown) {
          console.error(`Error updating role for user ID ${userId}:`, error);
          const message = error instanceof Error ? error.message : "Unknown database error.";
          return { success: false, message: `Database error: ${message}`, error: "DB Error" };
     }
}
// --- ^^^ END OF CORRECTION ^^^ ---

// --- Delete User Action ---
export async function deleteUserAction(clerkUserIdToDelete: string, dbUserIdToDelete: number): Promise<UserActionResult> {
     'use server';
     const callingUser = await getAuthenticatedUserWithRole();
     if (!callingUser) return { success: false, message: "Authentication required.", error: "Unauthorized" };
     const allowedDeleteRoles = ['Executive Director', 'Administrator'];
     if (!allowedDeleteRoles.includes(callingUser.roleName)) {
         return { success: false, message: "You do not have permission to delete users.", error: "Forbidden" };
     }
     if (callingUser.authProviderId === clerkUserIdToDelete) {
         return { success: false, message: "Cannot delete your own account.", error: "Forbidden" };
     }

     try {
         const pool = getDbPool();
         await pool.query('DELETE FROM ss_users WHERE user_id = $1', [dbUserIdToDelete]);
         
         const client = await clerkClient();
         await client.users.deleteUser(clerkUserIdToDelete);

         revalidatePath('/admin/users');
         return { success: true, message: "User deleted successfully." };
     } catch (error: unknown) {
         console.error(`Error deleting user ${clerkUserIdToDelete}:`, error);
         let errorMessage = "Failed to delete user.";
         if (isClerkApiError(error) && error.errors && error.errors.length > 0) {
            const firstError = error.errors[0];
            errorMessage = firstError.longMessage || firstError.message || errorMessage;
            if (firstError.code === 'resource_not_found') {
                errorMessage = "User not found in Clerk (might be already deleted).";
            }
         } else if (error instanceof Error) {
           errorMessage = error.message;
         }
         return { success: false, message: errorMessage, error: "API Error" };
     }
}