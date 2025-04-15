// components/UserControls.tsx (Example component)
import { UserButton } from "@clerk/nextjs"; // Import UserButton and server-side auth

export default function UserControls() {
  // You could also get user ID server-side if needed:
  // const { userId } = auth();

  return (
    <div className="flex items-center gap-4">
      {/* This component handles signed-in state, user menu, sign out */}
      <UserButton /> {/* Redirect to home after sign out */}
    </div>
  );
}