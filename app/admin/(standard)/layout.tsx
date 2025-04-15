// app/admin/(standard)/layout.tsx (NEW FILE)
'use client'; // Needs client wrapper which uses state

import React from 'react';
import AdminLayoutClientWrapper from '@/components/AdminLayoutClientWrapper';
import { useAuth } from '@/components/ClientSideAuthWrapper'; // Get user from context

export default function StandardAdminPagesLayout({ children }: { children: React.ReactNode }) {
    // Get user data provided by the parent layout's context
    const user = useAuth();

    // Render the standard admin structure (Header/Sidebar) around the page content
    return (
        <AdminLayoutClientWrapper user={user}>
            {children}
        </AdminLayoutClientWrapper>
    );
}