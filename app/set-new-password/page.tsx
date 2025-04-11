// app/set-new-password/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
// Remove useStytchSession - not needed here, token is the authorization
import { useStytch } from '@stytch/nextjs';
import { useRouter, useSearchParams } from 'next/navigation'; // Need useSearchParams
import BlankHeader from '@/components/blankHeader';

export default function SetNewPasswordPage() {
    const stytch = useStytch();
    const router = useRouter();
    const searchParams = useSearchParams(); // Get search params

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null); // State to hold token

    // Extract token once on component mount
    useEffect(() => {
         const urlToken = searchParams.get('token');
         if (!urlToken) {
              console.error("Set New Password: Token missing from URL.");
              setError("Invalid or missing password reset link.");
              // Optionally redirect after delay
              // setTimeout(() => router.replace('/login'), 3000);
         }
         setToken(urlToken);
    }, [searchParams]); // Re-run if searchParams change (unlikely here)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        // Check if token was found from URL
        if (!token) {
            setError("Password reset token is missing or invalid.");
            return;
        }
        if (newPassword.length < 8) { setError("Password must be >= 8 characters."); return; }
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

        setIsLoading(true);

        try {
            // --- CORRECTED: Use stytch.passwords.resetByEmail ---
            // This method uses the token from the email link and the new password.
            // It handles token validation and sets the new password.
            // It also typically authenticates a session upon success.
            await stytch.passwords.resetByEmail({
                token: token,           // The token from the URL
                password: newPassword,  // The new password from the form
                // Optionally set session duration for the session created upon success
                session_duration_minutes: 60 * 24 * 7 // Example: 1 week
            });
            // --- END CORRECTION ---

            setSuccess("Password updated successfully! Redirecting...");
            // Stytch automatically creates a session. Redirect to admin.
            setTimeout(() => {
                router.replace('/admin');
            }, 2000);

        } catch (err: any) {
            console.error("Password reset error:", err);
            setError(err.error_message || "Failed to reset password. The link may be invalid or expired.");
        } finally {
            setIsLoading(false);
        }
    };

    // Render loading/error if token missing initially
    if (typeof window !== 'undefined' && !token && !error) { // Check token state
         return (
              <main className="flex flex-col min-h-screen bg-base-200">
                   <BlankHeader/>
                   <div className="flex flex-grow items-center justify-center p-4">
                       {error ? <p className="text-error">{error}</p> : <p>Loading reset link...</p>}
                    </div>
              </main>
         );
    }


    // Render the main page content (form)
    return (
        <main className="flex flex-col min-h-screen bg-base-200">
            <BlankHeader/>
            <div className="flex flex-grow items-center justify-center p-4">
                <div className="card bg-primary w-full max-w-md shadow-xl text-primary-content">
                    <form onSubmit={handleSubmit}>
                         <div className="card-body">
                            <h2 className="card-title text-2xl">Set New Password</h2>
                             <p className="text-sm mb-4">Enter and confirm your new password.</p>
                             {/* ... Inputs ... */}
                             <label className="form-control w-full">
                                 <div className="label"><span className="label-text text-primary-content">New Password</span></div>
                                 <input type="password" required placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input input-bordered w-full bg-white text-base-content" disabled={isLoading || !!success || !token} />
                             </label>
                              <label className="form-control w-full mt-4">
                                 <div className="label"><span className="label-text text-primary-content">Confirm New Password</span></div>
                                 <input type="password" required placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input input-bordered w-full bg-white text-base-content" disabled={isLoading || !!success || !token} />
                             </label>
                             {/* ... Error/Success ... */}
                              {error && ( <div role="alert" className="alert alert-error mt-4"> {/* ... */} <span>{error}</span></div> )}
                              {success && ( <div role="alert" className="alert alert-success mt-4"> {/* ... */} <span>{success}</span></div> )}
                             {/* ... Submit Button ... */}
                              <div className="card-actions justify-start mt-6">
                                 <button type="submit" className="btn btn-secondary" disabled={isLoading || !!success || !token}>
                                     {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Set New Password"}
                                 </button>
                             </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}