// app/authenticate/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useStytch, useStytchSession } from '@stytch/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthenticatePage() {
  const stytch = useStytch();
  const { session, isInitialized } = useStytchSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Authenticating...');
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (!isInitialized || !stytch) { setMessage("Initializing..."); return; }
    if (session) { /* ... Session found, redirect to /admin ... */ return; }

    const token = searchParams.get('token');
    const tokenType = searchParams.get('stytch_token_type');

    // Handle Magic Link (remains the same)
    if (token && tokenType === 'magic_links' && !hasAttemptedAuth) {
        setHasAttemptedAuth(true);
        setMessage('Processing link...');
        setIsProcessing(true);
        stytch.magicLinks.authenticate(token, { session_duration_minutes: 60 * 24 * 7 })
            .then(() => console.log('Magic link auth successful.')) // Rely on re-render for redirect
            .catch((err) => {
                console.error('Magic link authentication error:', err);
                setMessage('Authentication failed. Invalid or expired link.');
                setIsProcessing(false);
                setTimeout(() => router.replace('/login'), 3000);
            });
        return;
    }

    // --- REVISED: Handle Password Reset Token ---
    // Just redirect immediately to the dedicated page
    if (token && tokenType === 'reset_password' && !hasAttemptedAuth) {
        setHasAttemptedAuth(true); // Mark as processed
        console.log('Authenticate page: Password reset token found, redirecting to set new password page...');
        setMessage('Redirecting to set new password...');
        setIsProcessing(false); // Done processing here
        router.replace(`/set-new-password?token=${encodeURIComponent(token)}`); // Pass token along
        return;
    }
    // --- END REVISED ---

    // Fallback if initialized, no session, and no valid tokens were processed
    if (isInitialized && !session && !hasAttemptedAuth && !(token && (tokenType === 'magic_links' || tokenType === 'reset_password'))) {
        console.log('Authenticate page: Initialized, no session, no valid tokens found. Redirecting to login.');
        setMessage('Authentication required.');
        setIsProcessing(false);
        router.replace('/login');
    }

  }, [stytch, session, isInitialized, router, searchParams, hasAttemptedAuth]);

  // Render loading indicator
  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
       {isProcessing && <span className="loading loading-dots loading-lg"></span>}
      <p className="mt-4">{message}</p>
    </div>
  );
}