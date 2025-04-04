// src/app/components/sidebar.tsx
"use client"; // Can be a client component if it has internal interactions, but not strictly necessary if only receiving props

import React from 'react';
import { X } from 'lucide-react'; // Or your preferred icon library

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  children?: React.ReactNode; // To pass menu items
}

function Sidebar({ isOpen, toggleSidebar, children }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          flex flex-col flex-shrink-0
          w-64 lg:w-64 xl:w-72
          bg-base-200 text-base-content
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-base-300">
          <span className="text-lg font-semibold">MyApp</span>
          <button
            onClick={toggleSidebar}
            className="btn btn-ghost btn-sm btn-circle lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="menu space-y-2">
            {children ? (
              children
            ) : (
              <>
                {/* Default Example Menu Items if no children passed */}
                <li><a>Dashboard</a></li>
                <li><a>Analytics</a></li>
                <li className="menu-title"><span>Category</span></li>
                <li><a>Item 1</a></li>
              </>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-base-300">
          <p className="text-sm text-base-content/70">© 2023</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;