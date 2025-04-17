// components/sidebar.js
import React from 'react';
import Link from 'next/link';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';

/**
 * Sidebar component for general navigation.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the sidebar is open or closed.
 * @param {function} props.toggleSidebar - Function to toggle the sidebar state.
 * @param {import('@/components/ClientSideAuthWrapper').ClientUser | null | undefined} [props.user] - Optional authenticated user object (conforming to ClientUser type) or null/undefined.
 */
// Default parameter user = null is fine here
export default function Sidebar({ isOpen, toggleSidebar, user = null }) {
  const baseClasses = `relative bg-primary text-primary-content h-screen flex flex-col transition-width duration-300 ease-in-out overflow-hidden`;
  const widthClasses = isOpen ? 'w-48' : 'w-16';

  // Determine permissions based on user role
  const canManageUsers = user && ['Executive Director', 'Administrator'].includes(user.role_name);
  const canManageEvents = user && ['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.role_name);
  // Assume most admin roles can view athletes, adjust if needed
  const canViewAthletes = user && ['Executive Director', 'Administrator', 'Chief of Competition', 'Technical Director', 'Head Judge'].includes(user.role_name);

  return (
    <div className={`${baseClasses} ${widthClasses}`}>
      <nav className={`flex flex-col space-y-2 p-4 flex-grow transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isOpen && (
          <>
            {/* Standard Links */}
            <Link href="/admin" className="hover:bg-primary-focus p-2 rounded block">
              Admin Dashboard
            </Link>
            {canManageEvents && (
                <Link href="/admin/events" className="hover:bg-primary-focus p-2 rounded block">
                Events
                </Link>
            )}
            {/* --- ADDED ATHLETES LINK --- */}
            {canViewAthletes && (
                <Link href="/admin/athletes" className="hover:bg-primary-focus p-2 rounded block">
                Athletes
                </Link>
            )}
            {/* --- END ADDED LINK --- */}
            {canManageUsers && (
              <Link href="/admin/users" className="hover:bg-primary-focus p-2 rounded block">
                Manage Users
              </Link>
            )}
            <Link href="/admin/settings" className="hover:bg-primary-focus p-2 rounded block">
              Settings
            </Link>
          </>
        )}
         {!isOpen && (
             <div className="flex flex-col items-center space-y-4 mt-4">
                 {/* TODO: Add Icons for collapsed view */}
             </div>
         )}
      </nav>

      {/* Toggle Button Area */}
      <div className="p-4 border-t border-primary-focus">
        {/* ... toggle button JSX ... */}
         <button
           onClick={toggleSidebar}
           className="flex items-center justify-center w-full text-primary-content/80 hover:text-primary-content focus:outline-none"
           aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
           aria-expanded={isOpen}
         >
           {isOpen ? <ChevronDoubleLeftIcon className="h-6 w-6" /> : <ChevronDoubleRightIcon className="h-6 w-6" />}
         </button>
      </div>
    </div>
  );
}