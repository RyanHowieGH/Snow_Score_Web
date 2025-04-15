// /app/admin/page.js (Corrected - Page Content Only AGAIN)
'use client';

import React from 'react';
import Link from 'next/link';
// --- REMOVE Imports for wrappers/hooks ---
// import AdminLayoutClientWrapper from '@/components/AdminLayoutClientWrapper';
// import { useAuth } from '@/components/ClientSideAuthWrapper';

export default function AdminDashboardPage() {
    // --- REMOVE useAuth hook ---
    // const user = useAuth();

    // --- Return ONLY the page content ---
    return (
        // REMOVE AdminLayoutClientWrapper wrapper
        <div className="flex flex-col items-center justify-center pt-10">
            <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
            <p className="text-lg mb-8">
                {/* Cannot easily access user name here without prop drilling or context again */}
                Manage your events and athletes
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                 <Link href="/events" className="btn btn-lg btn-accent">Events</Link>
                 {/* Cannot easily do conditional links here without props/context */}
                 <Link href="/admin/users" className="btn btn-lg btn-accent">Users</Link>
                 <Link href="/athletes" className="btn btn-lg btn-accent">Athletes</Link>
            </div>
        </div>
    );
}