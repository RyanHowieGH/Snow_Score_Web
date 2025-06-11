// /components/header.js
"use client"; // <-- IMPORTANT: Add this to make it a Client Component

import React from "react";
import Link from 'next/link';
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"; // <-- Import Clerk components

/**
 * Header component for the application.
 * Can optionally display an event name.
 *
 * @param {object} props - Component props.
 * @param {string | null | undefined} [props.eventName] - The name of the event to display.
 */
export default function Header({ eventName = null }) {
    const logoSize = 140;

    return (
        <div className="navbar bg-primary text-primary-content shadow-sm">
            {/* Left Side: Logo and Optional Event Name */}
            <div className="flex-1 flex items-center h-20">
                <Link href="/admin" className="cursor-pointer"> {/* Added cursor-pointer class to Link */}
                   <Image
                        src="/assets/goggles_borderless.png"
                        alt="Goggles Logo"
                        width={logoSize}
                        height={logoSize}
                        className="ml-5 rounded-full" // Removed cursor-pointer from Image, Link handles it
                        priority
                    />
                </Link>
                {eventName && (
                    <span className="ml-4 text-xl font-semibold hidden sm:inline">
                        {eventName}
                    </span>
                )}
            </div>

            {/* Right Side: Navigation Links and Auth Button */}
            <div className="flex-none flex items-center gap-8 mr-4"> {/* Ensure items-center for vertical alignment */}
                 <Link href="/admin/athletes" className="btn btn-ghost text-primary-content hover:bg-primary-focus text-xl">
                    Athletes
                 </Link>
                 <Link href="/admin/events" className="btn btn-ghost text-primary-content hover:bg-primary-focus text-xl mr-2">
                    Events
                 </Link>

                {/* Clerk Authentication Section */}
                <SignedIn>
                    {/* User is signed in - UserButton includes profile & sign out */}
                    <div className="ml-2"> {/* Add some margin if needed */}
                        <UserButton afterSignOutUrl="/" appearance={{
                            elements: {
                                userButtonAvatarBox: "w-10 h-10", // Example: Make avatar slightly larger
                                userButtonPopoverCard: "bg-base-100 text-base-content" // Example: Style popover
                            }
                        }}/>
                    </div>
                </SignedIn>
                <SignedOut>
                    {/* User is signed out - Show Log In button */}
                    <Link href="/sign-in" className="btn btn-accent hover:btn-accent-focus ml-2"> {/* Or your preferred login button style */}
                        Log In
                    </Link>
                </SignedOut>
            </div>
        </div>
    );
}