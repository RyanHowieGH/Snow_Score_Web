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

  useEffect(() => {
    if (!isInitialized || !stytch) { /* ... Initializing ... */ return; }
    if (session) { /* ... Session found, redirect to /admin ... */ return; }

    const token = searchParams.get('token');
    const tokenType = searchParams.get('stytch_token_type');

    // Handle Magic Link
    if (token && tokenType === 'magic_links' && !hasAttemptedAuth) {
        setHasAttemptedAuth(true);
        setMessage('Processing link...');
        stytch.magicLinks.authenticate(token, { session_duration_minutes: 60 * 24 * 7 })
            .then(() => console.log('Magic link auth successful.')) // Rely on re-render for redirect
            .catch((err) => { /* ... handle error ... */ });
        return;
    }

    // --- REVISED: Handle Password Reset Token ---
    if (token && tokenType === 'reset_password' && !hasAttemptedAuth) {
        setHasAttemptedAuth(true);
        console.log('Authenticate page: Password reset token found, authenticating session...');
        setMessage('Processing password reset link...');
        // Use passwords.authenticate with the session_token option
        // This exchanges the reset token for an active (short-lived) session
        stytch.passwords.authenticate({
                session_token: token, // Pass the reset token here
                session_duration_minutes: 30 // Keep session short for reset purpose
            })
            .then(() => {
                 console.log('Authenticate page: Password reset token authenticated into session.');
                 // NOW that a session exists, redirect to the page where they can set the password
                 setMessage('Redirecting to set new password...');
                 router.replace('/set-new-password'); // No token needed in URL now
            })
            .catch((err) => {
                 console.error('Password reset token authentication error:', err);
                 setMessage('Authentication failed. Invalid or expired link.');
                 setIsProcessing(false); // Use isProcessing state if needed
                 setTimeout(() => router.replace('/login'), 3000);
            });
        return;
    }
    // --- END REVISED ---

    // Fallback if no session/token after init
    if (isInitialized && !session && !hasAttemptedAuth && !(token && (tokenType === 'magic_links' || tokenType === 'reset_password'))) {
        // ... redirect to login ...
         console.log('Authenticate page: Initialized, no session, no valid tokens found. Redirecting to login.');
         setMessage('Authentication required.');
         router.replace('/login');
    }

  }, [stytch, session, isInitialized, router, searchParams, hasAttemptedAuth]); // Added isInitialized

  // ... render loading ...
   return ( <div className="flex flex-col justify-center items-center min-h-screen"> {/* ... loading indicator ... */} </div> );
}