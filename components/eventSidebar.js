// components/eventSidebar.js
import React from 'react';
import Link from 'next/link';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';

export default function EventSidebar({ isOpen, toggleSidebar, eventId }) {
  // THE FIX IS HERE:
  // Change `h-screen-minus-header` to `h-full`.
  // The parent container in your layout.tsx is now responsible for the height,
  // so this component just needs to fill 100% of its parent.
  const baseClasses = `relative bg-primary text-primary-content h-full flex flex-col transition-width duration-300 ease-in-out overflow-hidden`; 
  const widthClasses = isOpen ? 'w-48' : 'w-16';

  const eventBaseUrl = `/admin/events/${eventId}`;

  return (
    <div className={`${baseClasses} ${widthClasses}`}>
      {/* Nav section: Takes up available space, allows scrolling if needed */}
      <nav className={`flex flex-col space-y-2 p-4 overflow-y-auto transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isOpen && (
          <>
            <Link href={`${eventBaseUrl}`} className="hover:bg-primary-focus p-2 rounded block">
              Dashboard
            </Link>
            <Link href={`${eventBaseUrl}/settings`} className="hover:bg-primary-focus p-2 rounded block">
              Settings
            </Link>
            <Link href={`${eventBaseUrl}/manage-schedule`} className="hover:bg-primary-focus p-2 rounded block">
              Schedule
            </Link>
             <Link href={`${eventBaseUrl}/manage-judges`} className="hover:bg-primary-focus p-2 rounded block">
              Judges
            </Link>
             <Link href={`${eventBaseUrl}/reports`} className="hover:bg-primary-focus p-2 rounded block">
              Reports
            </Link>
            <Link href={`${eventBaseUrl}/head-judge`} className="hover:bg-primary-focus p-2 rounded block">
              Head Judge Panel
            </Link>
             <Link href={`${eventBaseUrl}/links`} className="hover:bg-primary-focus p-2 rounded block">
              External Links
            </Link>
          </>
        )}
      </nav>

      {/* Toggle Button Area: mt-auto pushes this to the very bottom of the flex container */}
      <div className="mt-auto p-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-end-safe w-full text-primary-content/80 hover:text-primary-content focus:outline-none hover:cursor-pointer"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDoubleLeftIcon className="h-6 w-6" />
          ) : (
            <ChevronDoubleRightIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}

// // components/eventSidebar.js
// import React from 'react';
// import Link from 'next/link';
// import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';

// // Receive eventId to build correct links
// export default function EventSidebar({ isOpen, toggleSidebar, eventId }) {
//   const baseClasses = `relative bg-primary text-primary-content h-screen-minus-header flex flex-col transition-width duration-300 ease-in-out overflow-hidden`; // Assuming h-screen-minus-header exists or define it
//   const widthClasses = isOpen ? 'w-48' : 'w-16';

//   // Base URL for event-specific links
//   const eventBaseUrl = `/admin/events/${eventId}`;

//   return (
//     <div className={`${baseClasses} ${widthClasses}`}>
//       <nav className={`flex flex-col space-y-2 p-4 flex-grow transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}> {/* Hide links when collapsed */}
//         {isOpen && (
//           <>
//             {/* Use template literals for dynamic links */}
//             <Link href={`${eventBaseUrl}`} className="hover:bg-primary-focus p-2 rounded block">
//               Dashboard
//             </Link>
//             <Link href={`${eventBaseUrl}/settings`} className="hover:bg-primary-focus p-2 rounded block">
//               Settings
//             </Link>
//             <Link href={`${eventBaseUrl}/schedule`} className="hover:bg-primary-focus p-2 rounded block">
//               Schedule
//             </Link>
//              <Link href={`${eventBaseUrl}/judges`} className="hover:bg-primary-focus p-2 rounded block">
//               Judges
//             </Link>
//              <Link href={`${eventBaseUrl}/reports`} className="hover:bg-primary-focus p-2 rounded block">
//               Reports
//             </Link>
//             <Link href={`${eventBaseUrl}/head-judge`} className="hover:bg-primary-focus p-2 rounded block">
//               Head Judge
//             </Link>
//              <Link href={`${eventBaseUrl}/links`} className="hover:bg-primary-focus p-2 rounded block">
//               External Links
//             </Link>
//           </>
//         )}
//          {/* Optionally show icons only when collapsed */}
//          {!isOpen && (
//             <div className="flex flex-col items-center space-y-4 mt-4">
//             </div>
//          )}
//       </nav>

//       {/* Toggle Button Area */}
//       <div className="p-4 border-t border-primary-focus"> {/* Adjust border color */}
//         <button
//           onClick={toggleSidebar}
//           className="flex items-center justify-center w-full text-primary-content/80 hover:text-primary-content focus:outline-none"
//           aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
//           aria-expanded={isOpen}
//         >
//           {isOpen ? (
//             <ChevronDoubleLeftIcon className="h-6 w-6" />
//           ) : (
//             <ChevronDoubleRightIcon className="h-6 w-6" />
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }
