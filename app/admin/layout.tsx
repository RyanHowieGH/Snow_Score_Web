// app/admin/layout.tsx
import React from 'react';
import { auth } from '@clerk/nextjs/server'; // Import clerk auth helper
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'; // Import your helper
import { redirect } from 'next/navigation';
import ClientSideAuthWrapper, { ClientUser } from '@/components/ClientSideAuthWrapper'; // Import wrapper and type
import AdminLayoutClientWrapper from '@/components/AdminLayoutClientWrapper'; // Import the client wrapper for state

export default async function AdminLayout({ children }: { children: React.ReactNode }) {

    // 1. Check basic Clerk Authentication first
    const authObject = await auth(); // Await the promise
    const userId = authObject.userId; // Access userId from the resolved object

    if (!userId) {
        // User is not logged in according to Clerk. Redirect to sign-in.
        console.log("AdminLayout: No Clerk userId found, redirecting to sign-in.");
        redirect('/sign-in'); // Use Clerk's configured sign-in URL
    }

    // 2. User is authenticated with Clerk, now try to get app-specific details + role
    // We await this, but we won't necessarily redirect if it returns null immediately,
    // as the webhook might be delayed.
    const userWithRole = await getAuthenticatedUserWithRole();

    // Prepare client-safe user data (handle potential null from getAuthenticatedUserWithRole)
    // This structure MUST match the 'ClientUser' interface used by the context provider
    const clientSafeUser: ClientUser | null = userWithRole ? {
        id: userWithRole.authProviderId, // Clerk ID
        app_user_id: userWithRole.appUserId, // Your internal DB ID
        email: userWithRole.email,
        app_user_name: userWithRole.name, // Name from your DB
        role_name: userWithRole.roleName, // Role from your DB
        firstName: userWithRole.clerkFirstName, // Optional: Clerk first name
        lastName: userWithRole.clerkLastName,   // Optional: Clerk last name
    } : null; // Pass null if role lookup failed

    if (!userWithRole) {
        // Log a warning if Clerk auth passed but local linkage/role is missing
        // This helps debug webhook/linking issues without causing an immediate redirect loop
        console.warn(`AdminLayout: Clerk user ${userId} is authenticated, but failed to retrieve linked ss_users record or role. Webhook might be delayed or linking failed.`);
        // Consider redirecting to a specific "pending setup" or error page if this state persists
        // For now, we allow rendering but pass null user data.
    }

    // 3. Render layout structure using Client Components for state management
    return (
        // ClientSideAuthWrapper provides the user context to deeper client components
        <ClientSideAuthWrapper initialUser={clientSafeUser}>
            {/* AdminLayoutClientWrapper handles Header/Sidebar and their state */}
            <AdminLayoutClientWrapper user={clientSafeUser}>
                {/* The actual page content (e.g., admin dashboard, user list) goes here */}
                {children}
            </AdminLayoutClientWrapper>
        </ClientSideAuthWrapper>
    );
}