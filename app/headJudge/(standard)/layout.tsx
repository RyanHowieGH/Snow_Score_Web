// app/headJudge/(standard)/layout.tsx
'use client';

import React from 'react';
import HeadJudgeLayoutClientWrapper from '@/components/HeadJudgeLayoutClientWrapper';
import { useAuth } from '@/components/ClientSideAuthWrapper'; // Get user from context

export default function StandardAdminPagesLayout({ children }: { children: React.ReactNode }) {
    // Get user data provided by the parent layout's context
    const user = useAuth();

    // Render the standard headJudge structure (Header/Sidebar) around the page content
    return (
        <HeadJudgeLayoutClientWrapper user={user}>
            {children}
        </HeadJudgeLayoutClientWrapper>
    );
}