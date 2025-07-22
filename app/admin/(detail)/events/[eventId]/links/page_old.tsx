// // app/admin/(detail)/events/[eventId]/manage-divisions/page.tsx
// export const dynamic = 'force-dynamic';

// import React from 'react';
// import Link from 'next/link';
// import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
// import { redirect, notFound } from 'next/navigation';
// import { fetchEventById, fetchAllDivisions, fetchAssignedDivisionIds } from '@/lib/data';
// import ManageDivisionsForm from '@/components/ManageDivisionsForm';
// import type { Metadata } from 'next';

// export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
//     const eventIdString = params?.eventId;
//     if (typeof eventIdString !== 'string') return { title: 'Invalid Event ID Type' };
//     const eventId = parseInt(eventIdString, 10);
//     if (isNaN(eventId)) 
//         return { title: 'Invalid Event' };
//     const eventDetails = await fetchEventById(eventId);
//     return {
//         title: eventDetails ? `Manage Divisions: ${eventDetails.name}` : 'Manage Event Divisions',
//     };
// }
//     // Authorization Check
//     const user = await getAuthenticatedUserWithRole();
//     const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
//     if (!user || !allowedRoles.includes(user.roleName)) {
//         redirect('/admin');
//     }
