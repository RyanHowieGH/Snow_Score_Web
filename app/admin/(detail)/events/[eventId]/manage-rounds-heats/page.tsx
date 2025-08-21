// app/admin/(detail)/events/[eventId]/manage-rounds-heats/page.tsx
import React from "react";
import { notFound, redirect } from "next/navigation";
import {
  checkEventExistanceById,
  getRoundsAndHeats,
  getDivisionsForEvent,
} from "@/lib/data";
import { getAuthenticatedUserWithRole } from "@/lib/auth/user";
import RoundHeatManagementDisplay from "@/components/manage-round-heat/RoundHeatManagementDisplay";
import { Toaster } from "react-hot-toast";
import Link from "next/link";

type Division = {
  division_id: number;
  division_name: string;
};

type Round = {
  round_id: number;
  round_name?: string | null;
  is_final?: boolean | null;
  next_round_id?: number | null; // pointer toward the next stage (toward Finals)
  round_num: number;
  round_sequence: number;
  // Allow extra fields returned by your DB/function without type errors:
  [key: string]: any;
};

/**
 * Ensures Finals is index 0 (round_num = 1) and predecessors follow (2, 3, ...).
 * - Detects Finals via is_final, name === 'finals', or next_round_id === null.
 * - Walks backward from Finals using a prev map (next_round_id -> round).
 * - Renumbers round_num and round_sequence to match the new order.
 * - Appends orphan/unlinked rounds at the end (keeps their relative order).
 */
function normalizeRoundsForDivision(rounds: Round[]): Round[] {
  if (!Array.isArray(rounds) || rounds.length === 0) return rounds;

  // Identify "Finals"
  const finals =
    rounds.find((r) => r?.is_final) ||
    rounds.find((r) => r?.round_name?.toLowerCase() === "finals") ||
    rounds.find((r) => (r?.next_round_id ?? null) === null);

  if (!finals) {
    // If Finals can't be identified, avoid destructive changes
    return rounds;
  }

  // Build reverse lookup: next_round_id -> previous round
  const prev = new Map<number, Round>();
  for (const r of rounds) {
    const nextId = r?.next_round_id;
    if (typeof nextId === "number") {
      prev.set(nextId, r);
    }
  }

  // Walk backward from Finals: Finals -> (Semis) -> (Quarters) -> ...
  const ordered: Round[] = [];
  const seen = new Set<number>();

  let cur: Round | undefined = finals;
  while (cur && !seen.has(cur.round_id)) {
    ordered.push(cur);
    seen.add(cur.round_id);
    cur = prev.get(cur.round_id);
  }

  // Append any unlinked/orphan rounds to avoid losing them
  for (const r of rounds) {
    if (!seen.has(r.round_id)) ordered.push(r);
  }

  // Renumber so Finals = 1, next = 2, ...
  return ordered.map((r, i) => ({
    ...r,
    round_num: i + 1,
    round_sequence: i + 1,
  }));
}

export default async function ManageRoundsAndHeatsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const eventId = parseInt(params.eventId, 10);
  if (isNaN(eventId)) notFound();

  const user = await getAuthenticatedUserWithRole();
  const allowedRoles = [
    "Executive Director",
    "Administrator",
    "Chief of Competition",
  ];

  if (!user || !allowedRoles.includes(user.roleName)) {
    redirect("/admin");
  }

  const eventDetails = await checkEventExistanceById(eventId);
  if (!eventDetails) notFound();

  const divisions: Division[] = await getDivisionsForEvent(eventId);

  const divisionsWithRounds = await Promise.all(
    divisions.map(async (division) => {
      const roundsRaw = (await getRoundsAndHeats(
        eventId,
        division.division_id
      )) as Round[];
      const rounds = normalizeRoundsForDivision(roundsRaw);
      return { ...division, rounds };
    })
  );

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold">
          Manage Rounds and heats:{" "}
          <span className="font-normal">
            {/* If you have event name in eventDetails, show it here */}
            {eventDetails?.event_name ?? ""}
          </span>
        </h2>
        <Link
          href={`/admin/events/${eventId}`}
          className="btn btn-sm btn-outline"
        >
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
  );
}
