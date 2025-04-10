// app/authenticate/page.tsx (Example Handler Page)
'use client'; // Needs client hooks

import { useEffect } from 'react';
import { useStytch, useStytchSession } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';

export default function AuthenticatePage() {
  const stytch = useStytch();
  const { session } = useStytchSession();
  const router = useRouter();

  useEffect(() => {
    if (stytch && !session) {
      // If no session, check URL for tokens and authenticate
      // The SDK often handles magic links/oauth automatically here.
      // For passwords, the session might already be set upon redirect.
      console.log('Authenticate page: No session, checking tokens...');
      // Stytch SDK's StytchProvider likely handles token exchange automatically
      // We might just need to wait or check if authentication fails.
      // Add a small delay or check stytch.user.get() if needed,
      // but often just checking session on next render is enough.

    } else if (session) {
       console.log('Authenticate page: Session found, redirecting to admin...');
      // If session exists, authentication was successful (or already logged in)
      // Redirect to the desired page
      router.replace('/admin'); // Use replace to avoid history entry
    } else {
         // Handle cases where authentication might fail or is still pending
         console.log('Authenticate page: Waiting for session or token...');
         // Maybe show a loading indicator
    }

    // If after some time no session appears, redirect to login
    const timer = setTimeout(() => {
         if (!session) {
              console.log('Authenticate page: Timeout, redirecting to login.');
              router.replace('/login');
         }
    }, 5000); // 5 second timeout example

    return () => clearTimeout(timer);

  }, [stytch, session, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="loading loading-dots loading-lg"></span>
      <p className="ml-4">Authenticating...</p>
    </div>
  );
}