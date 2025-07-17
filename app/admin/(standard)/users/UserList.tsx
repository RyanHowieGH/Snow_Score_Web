// app/admin/users/UserList.tsx
'use client';

import { useState, useTransition } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteUserAction } from './actions';
import type { UserWithRole } from '@/lib/definitions';

interface UserListProps {
  users: UserWithRole[];
  currentUserId: number; // The database ID of the currently logged-in admin
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = (clerkId: string, dbId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) {
      return;
    }
    setDeletingId(dbId); // Set loading state for this specific user
    startTransition(async () => {
      const result = await deleteUserAction(clerkId, dbId);
      if (!result.success) {
        alert(result.message); // Replace with a toast notification for better UX
      }
      // Revalidation from the server action will refresh the list.
      setDeletingId(null); // Clear loading state
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.user_id === currentUserId;
            const isDeletingThisUser = isPending && deletingId === user.user_id;

            return (
              <tr key={user.user_id} className="hover">
                <td>{`${user.first_name} ${user.last_name}`}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge badge-ghost badge-sm">{user.role_name}</span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => handleDelete(user.auth_provider_user_id, user.user_id)}
                    className="btn btn-ghost btn-sm btn-square"
                    title={`Delete ${user.first_name}`}
                    disabled={isCurrentUser || isDeletingThisUser}
                  >
                    {isDeletingThisUser ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <TrashIcon className="h-5 w-5 text-error" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}