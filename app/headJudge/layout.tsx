// app/headJudge/layout.tsx
import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import ClientSideAuthWrapper, { ClientUser } from '@/components/ClientSideAuthWrapper';

export default async function HeadJudgeRootLayout({ children }: { children: React.ReactNode }) {
    // 1. Check basic Clerk Authentication
    const { userId } = await auth();
    if (!userId) {
        console.log("HeadJudgeRootLayout: No Clerk userId found, redirecting to sign-in.");
        redirect('/sign-in');
    }

    // 2. Try to get app-specific details for context
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
        console.warn(`HeadJudgeRootLayout: Clerk user ${userId} authenticated, but role lookup failed.`);
    }

    // 3. Render the Auth Context Provider and the children
    return (
        <ClientSideAuthWrapper initialUser={clientSafeUser}>
            {children}
        </ClientSideAuthWrapper>
    );
}