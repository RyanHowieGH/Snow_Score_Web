// components/Sidebar.js
import React from 'react';
import Link from 'next/link';
// Import icons (example using Heroicons)
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';

export default function Sidebar({ isOpen, toggleSidebar }) {
  // Base classes for the sidebar container
  // - Use relative positioning to contain the absolute positioned toggle button
  // - Add transitions for width
  // - Set a background and text color
  // - Use flex column layout internally
  const baseClasses = `relative bg-primary text-white h-screen-minus-header flex flex-col transition-width duration-300 ease-in-out overflow-hidden`; // Custom height class needed

  // Width classes based on state
  const widthClasses = isOpen ? 'w-48' : 'w-16'; // Adjust collapsed width (w-16) if needed

  return (
    <div className={`${baseClasses} ${widthClasses}`}>
      {/* Navigation Links Container */}
      {/* Add transition for opacity, delay slightly to feel smoother with width change */}
      <nav className={`flex flex-col space-y-2 p-4 flex-grow transition-opacity duration-200 ease-in-out delay-150 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {isOpen && ( // Conditionally render links or just control opacity/visibility
          <>
            <Link href="/admin/dashboard" className="hover:bg-gray-700 p-2 rounded block">
              Dashboard
            </Link>
            <Link href="/events" className="hover:bg-gray-700 p-2 rounded block">
              Events
            </Link>
            <Link href="/athletes" className="hover:bg-gray-700 p-2 rounded block">
              Athletes
            </Link>
            <Link href="/admin/settings" className="hover:bg-gray-700 p-2 rounded block">
              Settings
            </Link>
            {/* Add more admin links as needed */}
          </>
        )}
      </nav>

      {/* Toggle Button Area - Positioned at the bottom */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full text-gray-400 hover:text-white focus:outline-none"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDoubleLeftIcon className="h-6 w-6" />
          ) : (
            <ChevronDoubleRightIcon className="h-6 w-6" />
          )}
          {/* Optional: Add text when open */}
          {/* <span className={`ml-2 transition-opacity duration-200 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}>{isOpen ? 'Collapse' : ''}</span> */}
        </button>
      </div>
    </div>
  );
}