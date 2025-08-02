import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { checkEventExistanceById, getRoundsAndHeats, getDivisionsForEvent } from '@/lib/data'
import { getAuthenticatedUserWithRole } from '@/lib/auth/user'
import RoundHeatManagementDisplay from '@/components/manage-round-heat/RoundHeatManagementDisplay'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'

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
    <div className="space-y-6">
    <Toaster />
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold">
        Manage Rounds and heats:{` `}
        <span className="font-normal">{}</span>
        </h2>
        <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
        Back to Event Dashboard
        </Link>
    </div>
      {divisionsWithRounds.map(({ division_id, division_name, rounds }) => (
        <div key={division_id} className="card bg-base-100 shadow-md">
            <div className="card-body space-y-4">
                <div className="flex items-center space-x-2">
                <span className="text-2xl font-semibold">DIVISION:</span>
                <span className="text-2xl">{division_name}</span>
                </div>
                <RoundHeatManagementDisplay rounds={rounds} />
            </div>
        </div>
      ))}

      <Toaster />
    </div>
  )
}
