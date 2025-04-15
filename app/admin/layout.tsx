// app/admin/layout.tsx (Server Component - Minimal Structure)
import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import ClientSideAuthWrapper, { ClientUser } from '@/components/ClientSideAuthWrapper';
// DO NOT import AdminLayoutClientWrapper here

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
    // 1. Check basic Clerk Authentication
    const { userId } = await auth();
    if (!userId) {
        console.log("AdminRootLayout: No Clerk userId found, redirecting to sign-in.");
        redirect('/sign-in');
    }

    // 2. Try to get app-specific details for context (optional here, could be done in group layouts)
    const userWithRole = await getAuthenticatedUserWithRole();
    const clientSafeUser: ClientUser | null = userWithRole ? {
        id: userWithRole.authProviderId,
        app_user_id: userWithRole.appUserId,
        email: userWithRole.email,
        app_user_name: userWithRole.name,
        role_name: userWithRole.roleName,
        firstName: userWithRole.clerkFirstName,
        lastName: userWithRole.clerkLastName,
    } : null;

    if (!userWithRole) {
        console.warn(`AdminRootLayout: Clerk user ${userId} authenticated, but role lookup failed.`);
    }

    // 3. Render ONLY the Auth Context Provider and the children
    // The appropriate layout from the route group ((standard) or (detail)) will be rendered within {children}
    return (
        <ClientSideAuthWrapper initialUser={clientSafeUser}>
            {children}
        </ClientSideAuthWrapper>
    );
}