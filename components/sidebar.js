// components/sidebar.js
import React from 'react';
import Link from 'next/link';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';

/**
 * Sidebar component for general navigation.
 * ... (JSDoc comments)
 */
export default function Sidebar({ isOpen, toggleSidebar, user = null }) {
  // CHANGE 1: Use h-full to inherit height from the parent layout container.
  const baseClasses = `relative bg-primary text-primary-content h-full flex flex-col transition-width duration-300 ease-in-out overflow-hidden`;
  const widthClasses = isOpen ? 'w-48' : 'w-16';

  // Permissions logic remains the same
  const canManageUsers = user && ['Executive Director', 'Administrator'].includes(user.role_name);
  const canManageEvents = user && ['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.role_name);
  const canViewAthletes = user && ['Executive Director', 'Administrator', 'Chief of Competition', 'Technical Director', 'Head Judge'].includes(user.role_name);
  const canAddJudges = user && ['Executive Director', 'Administrator', 'Chief of Competition', 'Head Judge'].includes(user.role_name);

  return (
    <div className={`${baseClasses} ${widthClasses}`}>
      {/* 
        CHANGE 2: Removed `flex-grow` and `max-h-fit`. Added `overflow-y-auto`.
        This lets the nav take its natural height and scroll if the content is too long.
      */}
      <nav className={`text-lg flex flex-col space-y-2 p-4 overflow-y-auto transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isOpen && (
          <>
            <Link href="/admin" className="hover:bg-primary-focus p-2 rounded block">
              Admin Dashboard
            </Link>
            {canManageEvents && (
                <Link href="/admin/events" className="hover:bg-primary-focus p-2 rounded block">
                Events
                </Link>
            )}
            {canViewAthletes && (
                <Link href="/admin/athletes" className="hover:bg-primary-focus p-2 rounded block">
                Athletes
                </Link>
            )}
            {canManageUsers && (
              <Link href="/admin/users" className="hover:bg-primary-focus p-2 rounded block">
                Manage Users
              </Link>
            )}
            {canAddJudges && (
              <Link href="/admin/headJudge" className="hover:bg-primary-focus p-2 rounded block">
                Head Judge
              </Link>
            )}
            <Link href="/admin/settings" className="hover:bg-primary-focus p-2 rounded block">
              Settings
            </Link>
          </>
        )}
        {!isOpen && (
          <div className="flex flex-col items-center space-y-4 mt-4">
            {/* You could place icons here for the collapsed state */}
          </div>
        )}
      </nav>

      {/* 
        CHANGE 3: Added `mt-auto`.
        This pushes the button container to the bottom of the flexbox.
      */}
      <div className="mt-auto p-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-end-safe w-full text-primary-content/80 hover:text-primary-content focus:outline-none hover:cursor-pointer"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronDoubleLeftIcon className="h-6 w-6" /> : <ChevronDoubleRightIcon className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}


// // components/sidebar.js
// import React from 'react';
// import Link from 'next/link';
// import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';

// /**
//  * Sidebar component for general navigation.
//  *
//  * @param {object} props - Component props.
//  * @param {boolean} props.isOpen - Whether the sidebar is open or closed.
//  * @param {function} props.toggleSidebar - Function to toggle the sidebar state.
//  * @param {import('@/components/ClientSideAuthWrapper').ClientUser | null | undefined} [props.user] - Optional authenticated user object (conforming to ClientUser type) or null/undefined.
//  */
// // Default parameter user = null is fine here
// export default function Sidebar({ isOpen, toggleSidebar, user = null }) {
//   const baseClasses = `relative bg-primary text-primary-content h-screen flex flex-col transition-width duration-300 ease-in-out overflow-hidden`;
//   const widthClasses = isOpen ? 'w-48' : 'w-16';

//   // Determine permissions based on user role
//   const canManageUsers = user && ['Executive Director', 'Administrator'].includes(user.role_name);
//   const canManageEvents = user && ['Executive Director', 'Administrator', 'Chief of Competition'].includes(user.role_name);
//   // Assume most admin roles can view athletes, adjust if needed
//   const canViewAthletes = user && ['Executive Director', 'Administrator', 'Chief of Competition', 'Technical Director', 'Head Judge'].includes(user.role_name);
//   // Currently Admin roles can view judges (for development & testing), expected to be further restricted
//   const canAddJudges = user && ['Executive Director', 'Administrator', 'Chief of Competition', 'Head Judge'].includes(user.role_name);

//   return (
//     <div className={`${baseClasses} ${widthClasses}`}>
//       <nav className={`text-lg flex flex-col space-y-2 p-4 flex-grow max-h-fit transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
//         {isOpen && (
//           <>
//             {/* Standard Links */}
//             <Link href="/admin" className="hover:bg-primary-focus p-2 rounded block">
//               Admin Dashboard
//             </Link>
//             {canManageEvents && (
//                 <Link href="/admin/events" className="hover:bg-primary-focus p-2 rounded block">
//                 Events
//                 </Link>
//             )}
//             {canViewAthletes && (
//                 <Link href="/admin/athletes" className="hover:bg-primary-focus p-2 rounded block">
//                 Athletes
//                 </Link>
//             )}
//             {canManageUsers && (
//               <Link href="/admin/users" className="hover:bg-primary-focus p-2 rounded block">
//                 Manage Users
//               </Link>
//             )}
//             {canAddJudges && (
//               <Link href="/headJudge" className="hover:bg-primary-focus p-2 rounded block">
//                 Head Judge
//               </Link>
//             )}
//             <Link href="/admin/settings" className="hover:bg-primary-focus p-2 rounded block">
//               Settings
//             </Link>
//           </>
//         )}
//         {!isOpen && (
//           <div className="flex flex-col items-center space-y-4 mt-4">
//           </div>
//         )}
//       </nav>

//       {/* Toggle Button Area */}
//       <div className="p-4 border-t border-primary-focus">
//         {/* ... toggle button JSX ... */}
//         <button
//           onClick={toggleSidebar}
//           className="flex items-center justify-center w-full text-primary-content/80 hover:text-primary-content focus:outline-none pb-1"
//           aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
//           aria-expanded={isOpen}
//         >
//           {isOpen ? <ChevronDoubleLeftIcon className="h-6 w-6" /> : <ChevronDoubleRightIcon className="h-6 w-6" />}
//         </button>
//       </div>
//     </div>
//   );
// }