// app/sign-in/[[...sign-in]]/page.tsx
// The [[...sign-in]] folder structure handles Clerk's routing needs
import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <SignIn path="/sign-in" /> {/* Mount the SignIn component */}
    </div>
  );
}