// components/sidebar.js
import React from 'react';
import Link from 'next/link';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid'; // Assuming you still use these

/**
 * Sidebar component for general navigation.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the sidebar is open or closed.
 * @param {function} props.toggleSidebar - Function to toggle the sidebar state.
 * @param {object | null} [props.user] - Optional authenticated user object containing role_name etc.
 */
// --- ADD 'user' to the destructured props ---
export default function Sidebar({ isOpen, toggleSidebar, user = null }) {
  const baseClasses = `relative bg-primary text-primary-content h-screen-minus-header flex flex-col transition-width duration-300 ease-in-out overflow-hidden`; // Adjust height class as needed
  const widthClasses = isOpen ? 'w-48' : 'w-16';

  // --- Optional: Example of using the user prop ---
  // You can now check user && user.role_name inside the component
  // to conditionally render links based on role.
  const canManageUsers = user && ['Executive Director', 'Administrator'].includes(user.role_name);
  const canManageEvents = user && ['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.role_name);
  // --- End Example ---

  return (
    <div className={`${baseClasses} ${widthClasses}`}>
      <nav className={`flex flex-col space-y-2 p-4 flex-grow transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isOpen && (
          <>
            {/* Standard Links */}
            <Link href="/admin" className="hover:bg-primary-focus p-2 rounded block">
              Admin Dashboard
            </Link>
            {/* Conditionally render links based on role */}
            {canManageEvents && (
                <Link href="/events" className="hover:bg-primary-focus p-2 rounded block">
                Events
                </Link>
            )}
             <Link href="/athletes" className="hover:bg-primary-focus p-2 rounded block">
              Athletes
            </Link>

            {/* Example Admin-only Link */}
            {canManageUsers && (
              <Link href="/admin/users" className="hover:bg-primary-focus p-2 rounded block">
                Manage Users
              </Link>
            )}

            <Link href="/admin/settings" className="hover:bg-primary-focus p-2 rounded block">
              Settings
            </Link>
            {/* Add more links as needed */}
          </>
        )}
        {/* Optionally add icons for collapsed view */}
         {!isOpen && (
             <div className="flex flex-col items-center space-y-4 mt-4">
                 {/* Icons can go here */}
             </div>
         )}
      </nav>

      {/* Toggle Button Area */}
      <div className="p-4 border-t border-primary-focus">
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