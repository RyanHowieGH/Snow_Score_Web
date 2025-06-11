// components/blankHeader.js
"use client"; // Ensures this is a Client Component

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"; // Clerk components

export default function BlankHeader() {
  const imageSize = 140;

  return (
    <div className="navbar bg-primary shadow-sm">
      <div className="navbar-start">
        <Link href="/">
            <Image
              src="/assets/goggles_borderless.png"
              alt="Goggles"
              width={imageSize}
              height={imageSize}
              className="ml-5 rounded-full cursor-pointer"
              priority
            />
        </Link>
      </div>
      <div className="navbar-end">
        <SignedIn>
          {/* User is signed in, UserButton provides profile access AND a Sign Out option */}
          <div className="mr-5">
            <UserButton afterSignOutUrl="/" /> {/* Redirect to homepage after sign out */}
          </div>
        </SignedIn>
        <SignedOut>
          {/* User is signed out, show sign-in button */}
          <Link href="/sign-in" className="btn bg-blue-300 hover:bg-blue-400 border-blue-300 hover:border-blue-400 text-black-800 mr-5 text-lg">
            Log In
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}