// /components/header.js
import React from "react";
import Link from 'next/link';
import Image from "next/image";


/**
 * Header component for the application.
 * Can optionally display an event name.
 *
 * @param {object} props - Component props.
 * @param {string | null | undefined} [props.eventName] - The name of the event to display.
 */
// Add eventName prop
export default function Header({ eventName = null }) {
    const logoSize = 90;


    return (
        <div className="navbar bg-primary text-primary-content shadow-sm"> {/* Ensure text color contrasts */}
            <div className="flex-1 flex items-center"> {/* Use flex to align items */}
                <Link href="/admin">
                   <Image src="/assets/goggles_borderless.png" alt="Goggles Logo"  width={logoSize} height={logoSize} className="ml-5 rounded-full cursor-pointer" priority/>
                </Link>
                {/* Display event name if provided */}
                {eventName && (
                    <span className="ml-4 text-xl font-semibold hidden sm:inline"> {/* Hide on extra small screens */}
                        {eventName}
                    </span>
                )}
            </div>
            <div className="flex-none gap-2 mr-4">
                 <Link href="/admin/athletes" className="btn btn-ghost text-primary-content">
                    Athletes
                 </Link>
                 <Link href="/admin/events" className="btn btn-ghost text-primary-content">
                    Events
                 </Link>
                 {/* <button className="btn btn-ghost btn-circle avatar">
                    <div className="w-8 rounded-full">
                       <Image src="/assets/admin_logo.png" alt="Admin Menu" />
                     </div>
                 </button> */}
            </div>
        </div>
    );
}