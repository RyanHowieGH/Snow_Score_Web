'use client';

import { useState, useTransition } from 'react';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { deleteUserAction } from './actions';
import type { UserWithRole } from '@/lib/definitions';
import EditUserRoleModal from './EditUserRoleModal';

// This Role type should ideally be moved to lib/definitions.ts to be shared
interface Role {
    role_id: number;
    role_name: string;
}

interface UserListProps {
  users: UserWithRole[];
  currentUserId: number;
  assignableRoles: Role[];
}

export default function UserList({ users, currentUserId, assignableRoles }: UserListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  // Corrected handleDelete function (removed duplicated declaration)
  const handleDelete = (clerkId: string, dbId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) {
      return;
    }
    setDeletingId(dbId);
    startTransition(async () => {
      const result = await deleteUserAction(clerkId, dbId);
      if (!result.success) {
        alert(result.message);
      }
      setDeletingId(null);
    });
  };

  return (
    <>
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
                  <td><span className="badge badge-ghost badge-sm">{user.role_name}</span></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => setEditingUser(user)}
                            className="btn btn-ghost btn-sm btn-square"
                            title={`Edit role for ${user.first_name}`}
                            disabled={isCurrentUser || isDeletingThisUser}
                        >
                            <PencilSquareIcon className="h-5 w-5 text-info" />
                        </button>

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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <EditUserRoleModal 
        userToEdit={editingUser} 
        assignableRoles={assignableRoles}
        onClose={() => setEditingUser(null)} 
      />
    </>
  );
}