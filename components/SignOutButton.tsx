// components/SignOutButton.tsx (Using Stytch Example)
'use client';

import { useStytch } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';
import { PowerIcon } from '@heroicons/react/24/outline';

export default function SignOutButton() {
  const stytch = useStytch();
  const router = useRouter();

  const onSignOut = async () => {
    await stytch.session.revoke(); // Call Stytch SDK's revoke function
    // Session is cleared client-side, refresh to update server state/redirect via middleware
    router.refresh();
    // router.push('/login'); // Or force redirect
  };

  return (
    <button onClick={onSignOut} className="btn btn-ghost btn-circle" title="Sign Out">
        <PowerIcon className="h-6 w-6" />
    </button>
  );
}