import React from 'react'
import { notFound, redirect } from 'next/navigation'
import {
  checkEventExistanceById,
  getRoundsAndHeats,
  getDivisionsForEvent,
} from '@/lib/data'
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'
import RoundHeatManagementDisplay from '@/components/manage-round-heat/RoundHeatManagementDisplay'
import { Toaster } from 'react-hot-toast'

type Division = {
  division_id: number
  division_name: string
}

export default async function ManageRoundsAndHeatsPage({ params }: {params: { eventId: string }}) {
  const eventId = parseInt(params.eventId, 10)
  if (isNaN(eventId)) notFound()

  const user = await getAuthenticatedUserWithRole()
  const allowedRoles = ['Executive Director', 'Administrator', 'Chief of Competition']

  if (!user || !allowedRoles.includes(user.roleName)) {
    redirect('/admin')
  }

  const eventDetails = await checkEventExistanceById(eventId)
  if (!eventDetails) notFound()

  const divisions: Division[] = await getDivisionsForEvent(eventId)

  const divisionsWithRounds = await Promise.all(
    divisions.map(async (division) => {
      const rounds = await getRoundsAndHeats(
        eventId,
        division.division_id
      )
      return { ...division, rounds }
    })
  )

  return (
    <div className="space-y-8">
      {divisionsWithRounds.map(({ division_id, division_name, rounds }) => (
        <div 
        key={division_id}>
            <div className='flex justify-center align-itens'>
                <h1 className='text-3xl font-bold text-center '>Division: {` `}</h1>
                <h2 className="text-2xl font-semibold text-center justify-center mb-4">
                    {division_name}
                </h2>
            </div>
          <RoundHeatManagementDisplay rounds={rounds} />
        </div>
      ))}

      <Toaster />
    </div>
  )
}
