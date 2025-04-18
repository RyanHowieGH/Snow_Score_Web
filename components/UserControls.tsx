// components/UserControls.tsx
import { UserButton } from "@clerk/nextjs";

export default function UserControls() {

  return (
    <div className="flex items-center gap-4">
      {/* This component handles signed-in state, user menu, sign out */}
      <UserButton /> {/* Redirect to home after sign out */}
    </div>
  );
}