"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar"; // Import the Sidebar
import React, { useState } from "react";
import Link from "next/link";

export default function Admin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Start open or closed?

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      {" "}
      {/* Ensure outer container takes full height */}
      <Header />
      {/* Container for Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {" "}
        {/* flex-1 allows this div to grow and fill remaining height */}
        {/* Render the Sidebar */}
        {/* It will take its width based on its internal state */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        {/* Main Content Area */}
        {/* flex-1 allows it to take remaining width */}
        {/* overflow-y-auto enables scrolling ONLY for the main content if it overflows */}
        <main className="flex-1 bg-gray-100 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-row items-center justify-center">
            <h2 className="text-5xl font-bold">Events</h2>
            <Link href="/admin" className="btn btn-secondary ml-4">
              Create an Event
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center mt-4">
            <ul className="list bg-base-100 rounded-box shadow-md">
              <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
                Most played songs this week
              </li>
              <li className="list-row">
                <div>
                  <img
                    className="size-10 rounded-box"
                    src="https://img.daisyui.com/images/profile/demo/1@94.webp"
                  />
                </div>
                <div>
                  <div>Dio Lupa</div>
                  <div className="text-xs uppercase font-semibold opacity-60">
                    Remaining Reason
                  </div>
                </div>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M6 3L20 12 6 21 6 3z"></path>
                    </g>
                  </svg>
                </button>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </g>
                  </svg>
                </button>
              </li>

              <li className="list-row">
                <div>
                  <img
                    className="size-10 rounded-box"
                    src="https://img.daisyui.com/images/profile/demo/4@94.webp"
                  />
                </div>
                <div>
                  <div>Ellie Beilish</div>
                  <div className="text-xs uppercase font-semibold opacity-60">
                    Bears of a fever
                  </div>
                </div>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M6 3L20 12 6 21 6 3z"></path>
                    </g>
                  </svg>
                </button>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </g>
                  </svg>
                </button>
              </li>

              <li className="list-row">
                <div>
                  <img
                    className="size-10 rounded-box"
                    src="https://img.daisyui.com/images/profile/demo/3@94.webp"
                  />
                </div>
                <div>
                  <div>Sabrino Gardener</div>
                  <div className="text-xs uppercase font-semibold opacity-60">
                    Cappuccino
                  </div>
                </div>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M6 3L20 12 6 21 6 3z"></path>
                    </g>
                  </svg>
                </button>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </g>
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
