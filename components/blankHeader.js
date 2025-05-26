// components/blankHeader.js
"use client"; // <-- VERY IMPORTANT: Add this for client-side interactivity

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"; // <-- Import Clerk components

export default function BlankHeader() {
  const imageSize = 90;

  return (
    <div className="navbar bg-primary shadow-sm">
      <div className="navbar-start">
        <Link href="/"> {/* Make logo clickable, e.g., to homepage */}
            <Image
              src="/assets/goggles_borderless.png"
              alt="Goggles"
              width={imageSize}
              height={imageSize}
              className="ml-5 rounded-full cursor-pointer" // Added cursor-pointer
              priority
            />
        </Link>
      </div>
      <div className="navbar-end">
        <SignedIn>
          {/* This content will render only if the user is signed in */}
          <div className="mr-5">
            <UserButton afterSignOutUrl="/" /> {/* Shows user avatar, dropdown, sign out */}
          </div>
        </SignedIn>
        <SignedOut>
          {/* This content will render only if the user is signed out */}
          <Link href="/sign-in" className="btn bg-blue-300 hover:bg-blue-400 border-blue-300 hover:border-blue-400 text-black-800 mr-5">
            Log In
          </Link>
          {/* Optionally, add a Sign Up button */}
          {/* <Link href="/sign-up" className="btn btn-secondary mr-5">
            Sign Up
          </Link> */}
        </SignedOut>
      </div>
    </div>
  );
}