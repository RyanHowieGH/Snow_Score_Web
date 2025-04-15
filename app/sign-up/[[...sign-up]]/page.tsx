// app/sign-up/[[...sign-up]]/page.tsx
// The [[...sign-up]] folder structure handles Clerk's routing needs
import { SignUp } from "@clerk/nextjs";
import React from "react";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <SignUp path="/sign-up" /> {/* Mount the SignUp component */}
    </div>
  );
}