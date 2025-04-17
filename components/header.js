// /components/header.js
import React from "react";
import Link from 'next/link'; // Import Link


/**
 * Header component for the application.
 * Can optionally display an event name.
 *
 * @param {object} props - Component props.
 * @param {string | null | undefined} [props.eventName] - The name of the event to display (optional).
 */
// Add eventName prop (optional)
export default function Header({ eventName = null }) {
    return (
        <div className="navbar bg-primary text-primary-content shadow-sm"> {/* Ensure text color contrasts */}
            <div className="flex-1 flex items-center"> {/* Use flex to align items */}
                {/* Link the logo back to a relevant page, e.g., admin dashboard */}
                <Link href="/admin">
                   <img src="/assets/goggles_borderless.png" alt="Goggles Logo" className="ml-5 h-10 rounded-full cursor-pointer" />
                </Link>
                {/* Display event name if provided */}
                {eventName && (
                    <span className="ml-4 text-xl font-semibold hidden sm:inline"> {/* Hide on extra small screens */}
                        {eventName}
                    </span>
                )}
            </div>
            <div className="flex-none gap-2 mr-4"> {/* Use flex-none and adjust margin */}
                 {/* Use Link components for navigation instead of buttons for better semantics */}
                 <Link href="/admin/athletes" className="btn btn-ghost text-primary-content">
                    Athletes
                 </Link>
                 <Link href="/admin/events" className="btn btn-ghost text-primary-content">
                    Events
                 </Link>
                 {/* Consider what the admin logo button should do - maybe link to user settings? */}
                 <button className="btn btn-ghost btn-circle avatar">
                    <div className="w-8 rounded-full"> {/* Adjust size */}
                       <img src="/assets/admin_logo.png" alt="Admin Menu" />
                     </div>
                 </button>
            </div>
        </div>
    );
}