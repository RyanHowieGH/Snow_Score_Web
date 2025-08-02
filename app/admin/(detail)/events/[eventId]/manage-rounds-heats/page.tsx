import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { checkEventExistanceById, getRoundsAndHeats } from '@/lib/data'
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'
import RoundHeatManagementDisplay from "@/components/manage-round-heat/RoundHeatManagementDisplay"
import { Toaster } from 'react-hot-toast'

export default async function ManageRoundsAndHeatsPage({ params }: { params: { eventId: string } }) {
    const eventIdString = params.eventId;
    const eventId = parseInt(eventIdString, 10);
    if (isNaN(eventId)) {
        notFound();
    }
    const user = await getAuthenticatedUserWithRole();
    const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition'];
    if (!user || !allowedRoles.includes(user.roleName)) {
        redirect('/admin');
    }
    const eventDetails = await checkEventExistanceById(eventId);
    if (!eventDetails) {
        notFound();
    }

    const rounds = await getRoundsAndHeats(eventId, 3);

   return (
        <div>
            <RoundHeatManagementDisplay
            rounds={rounds}/>
            <Toaster/>
        </div>
    )
}