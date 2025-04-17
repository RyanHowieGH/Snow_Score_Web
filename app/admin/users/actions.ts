// app/admin/users/actions.ts
'use server';

import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Schema for validating the creation form data
const CreateUserFormSchema = z.object({
    email: z.string().email("Invalid email address."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    roleId: z.coerce.number().int().min(1, "Invalid role selected."),
});

// --- DEFINE AND EXPORT the single source of truth for the form state ---
export interface CreateUserFormState { // Renamed from ActionResult
    success: boolean;
    message: string;
    tempPassword?: string; // Optional temp password on success
    error?: string;        // Optional general error message
    // Use the actual schema field names for field errors
    fieldErrors?: Partial<Record<keyof z.infer<typeof CreateUserFormSchema>, string[]>>;
}

// --- Server Action to Create User ---
// Ensure it returns the exported CreateUserFormState type
export async function createUserAction(
    prevState: CreateUserFormState | null, // prevState type matches
    formData: FormData
): Promise<CreateUserFormState> { // Return type matches

    // 1. Authorization Check
    const callingUser = await getAuthenticatedUserWithRole();
    if (!callingUser) {
        // Ensure returned object matches CreateUserFormState
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
        // Ensure returned object matches CreateUserFormState
        return {
            success: false,
            message: "Invalid form data.",
            error: "Validation failed.",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    const { email, firstName, lastName, roleId } = validation.data;

    // 3. Prevent creating higher/equal privileged roles
    // ... role hierarchy checks ...
     if (roleId === 1 && callingUser.roleName !== 'Executive Director') return { success: false, message: "Only the Executive Director can create another Executive Director.", error: "Forbidden" };
     if (roleId === 2 && !['Executive Director'].includes(callingUser.roleName)) return { success: false, message: "Only the Executive Director can create Administrators.", error: "Forbidden" };
     if (roleId === 3 && !['Executive Director', 'Administrator'].includes(callingUser.roleName)) return { success: false, message: "Only Exec Director or Admin can create Chief of Competition.", error: "Forbidden" };


    // 4. Generate Temporary Password
    const tempPassword = crypto.randomBytes(10).toString('base64url').slice(0, 10);
    console.log(`Generated temporary password for ${email}: ${tempPassword}`);

    try {
        console.log(`Admin ${callingUser.email} attempting to create user: ${email} with initial password.`);

        // 5. Call Clerk Backend API
        const client = await clerkClient();
        const newUser = await client.users.createUser({
            emailAddress: [email.toLowerCase()],
            firstName: firstName,
            lastName: lastName,
            password: tempPassword,
            publicMetadata: { initial_role_id: roleId }
        });

        console.log(`User created successfully in Clerk with ID: ${newUser.id}`);

        // 6. Linking & Role Assignment (Handled by Webhook)

        revalidatePath('/admin/users');
        // Ensure returned object matches CreateUserFormState
        return {
            success: true,
            message: `User ${email} created. Role assignment relies on webhook.`,
            tempPassword: tempPassword // Include temp password
        };

    } catch (error: any) {
        console.error("Error creating user via Clerk API:", error);
        if (error.errors) { console.error("Detailed Clerk Errors:", JSON.stringify(error.errors, null, 2)); }
        let errorMessage = "Failed to create user.";
        if (error.errors && error.errors.length > 0) {
             errorMessage = error.errors[0].longMessage || error.errors[0].message || errorMessage;
             if (error.errors[0].code === 'duplicate_record') {
                 errorMessage = `A user with email ${email} already exists.`
             }
             // Add checks for other specific codes if needed
        }
        // Ensure returned object matches CreateUserFormState
        return { success: false, message: errorMessage, error: "API Error" };
    }
}

// --- Update User Role Action Placeholder ---
// Return type should match CreateUserFormState or define a new specific one
export async function updateUserRoleAction(userId: number, newRoleId: number): Promise<CreateUserFormState> { // Example return type
     'use server';
     console.log(`Placeholder: Update user ${userId} to role ${newRoleId}`);
     // Implement logic
     return { success: true, message: "Role update not fully implemented."}; // Ensure return matches type
}

// --- Delete User Action Placeholder ---
// Return type should match CreateUserFormState or define a new specific one
export async function deleteUserAction(clerkUserIdToDelete: string): Promise<CreateUserFormState> { // Example return type
     'use server';
     console.log(`Placeholder: Delete user ${clerkUserIdToDelete}`);
      try {
          // Authorization check!
          const client = await clerkClient();
          await client.users.deleteUser(clerkUserIdToDelete);
           revalidatePath('/admin/users');
           return { success: true, message: "User deletion initiated with Clerk." }; // Ensure return matches type
      } catch (error: any) {
           console.error("Error deleting user via Clerk API:", error);
           let errorMessage = "Failed to delete user.";
            if (error.errors && error.errors.length > 0) { errorMessage = error.errors[0].longMessage || errorMessage }
           return { success: false, message: errorMessage, error: "API Error" }; // Ensure return matches type
      }
}