// app/set-new-password/page.tsx
'use client';

// ... imports (useState, useEffect, useStytchSession, useRouter, BlankHeader) ...
import { useState, FormEvent, useEffect } from 'react';
import { useStytch, useStytchSession } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';
import BlankHeader from '@/components/blankHeader';


export default function SetNewPasswordPage() {
    const stytch = useStytch(); // Get the client-side Stytch instance
    const { session, isInitialized } = useStytchSession();
    const router = useRouter();
    // ... state variables (newPassword, confirmPassword, error, success, isLoading) ...
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    // ... useEffect to check session ...
    useEffect(() => {
        if (isInitialized && !session) {
             console.log("Set New Password: No session found after init, redirecting to login.");
             router.replace('/login');
        }
    }, [session, isInitialized, router]);

    const handleSubmit = async (event: FormEvent) => {
        // ... preventDefault, clear errors, validation ...
        if (!session) { /* ... */ return; }
        if (newPassword.length < 8) { /* ... */ return; }
        if (newPassword !== confirmPassword) { /* ... */ return; }


        setIsLoading(true);

        try {
            await stytch.passwords.resetBySession({
                password: newPassword, // The new password
                // --- ADD REQUIRED SESSION DURATION ---
                session_duration_minutes: 60 * 24 * 7 // Example: 1 week (10080 minutes)
                // --- END ADD ---
            });

            setSuccess("Password updated successfully! Redirecting...");
            // ... setTimeout and redirect ...
            setTimeout(() => { router.replace('/admin'); }, 2000);

        } catch (err: any) {
            console.error("Password reset error:", err);
            setError(err.error_message || "Failed to update password.");
        } finally {
            setIsLoading(false);
        }
    };

    // ... Loading/Redirecting checks ...
    if (!isInitialized) { /* ... loading ... */ }
    if (!session && isInitialized) { /* ... redirecting ... */ }

    // ... JSX for the form ...
    return (
        <main className="flex flex-col min-h-screen bg-base-200">
             <BlankHeader/>
            <div className="flex flex-grow items-center justify-center p-4">
                <div className="card bg-primary w-full max-w-md shadow-xl text-primary-content">
                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                             <h2 className="card-title text-2xl">Set New Password</h2>
                             {/* ... Input fields ... */}
                             <label className="form-control w-full">
                                 <div className="label"><span className="label-text text-primary-content">New Password</span></div>
                                 <input type="password" required placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input input-bordered w-full bg-white text-base-content" disabled={isLoading || !!success} />
                             </label>
                              <label className="form-control w-full mt-4">
                                 <div className="label"><span className="label-text text-primary-content">Confirm New Password</span></div>
                                 <input type="password" required placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input input-bordered w-full bg-white text-base-content" disabled={isLoading || !!success} />
                             </label>
                             {/* ... Error/Success messages ... */}
                              {error && ( <div role="alert" className="alert alert-error mt-4"> {/* ... */} <span>{error}</span></div> )}
                              {success && ( <div role="alert" className="alert alert-success mt-4"> {/* ... */} <span>{success}</span></div> )}
                             {/* ... Submit Button ... */}
                              <div className="card-actions justify-start mt-6">
                                 <button type="submit" className="btn btn-secondary" disabled={isLoading || !!success}>
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