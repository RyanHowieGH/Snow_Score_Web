// app/login/page.tsx (Renamed to .tsx for better type safety)
'use client';

import React from 'react';
import { StytchLogin } from '@stytch/nextjs'; // Import Stytch UI Component
import { Products } from '@stytch/vanilla-js'; // Import Products enum
import BlankHeader from "../../components/blankHeader";
import { useRouter } from 'next/navigation';

// Get base URL for redirects (important for deployment)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const REDIRECT_URL = `${APP_URL}/authenticate`;

// Configuration for the Stytch Login component
const stytchLoginConfig = {
    products: [Products.passwords, Products.emailMagicLinks], // Allow Password & Magic Link
    passwordOptions: {
        loginRedirectURL: REDIRECT_URL,
        signupRedirectURL: REDIRECT_URL,
        resetPasswordRedirectURL: `${APP_URL}/reset-password` // You'll need to create this page
    },
    emailMagicLinksOptions: {
        loginRedirectURL: REDIRECT_URL,
        signupRedirectURL: REDIRECT_URL,
        loginExpirationMinutes: 60,
        signupExpirationMinutes: 60,
    },
};

// Styles for the Stytch component (optional, customize as needed)
const stytchStyles = {
     container: { width: '100%' },
     buttons: {
         primary: {
             backgroundColor: 'oklch(var(--s))', // Use DaisyUI secondary color variable
             borderColor: 'oklch(var(--s))',
             color: 'oklch(var(--sc))', // Secondary content color
             '&:hover': { // Example hover
                 backgroundColor: 'oklch(var(--s) / 0.8)', // Make slightly transparent on hover
                 borderColor: 'oklch(var(--s) / 0.8)',
             }
         }
     },
     input: { // Style inputs to somewhat match DaisyUI
         borderColor: 'oklch(var(--b3))', // Use base-300 border
         backgroundColor: 'oklch(var(--b1))', // Use base-100 background
         textColor: 'oklch(var(--bc))', // Use base-content text color
     },
     // Add more style overrides if desired
};


export default function LoginPage() {
    const router = useRouter(); // Use next/navigation

    return (
        <main className="flex flex-col min-h-screen bg-base-200"> {/* Use theme background */}
            <BlankHeader/>
            <div className="flex flex-grow items-center justify-center p-4">
                <div className="card bg-primary w-full max-w-md shadow-xl text-primary-content"> {/* DaisyUI card */}
                    <div className="card-body items-center p-6 sm:p-8"> {/* Add padding */}
                         <h2 className="card-title text-2xl sm:text-3xl mb-6">Sign In or Sign Up</h2>
                         {/* Render the Stytch Login/Signup component */}
                        <StytchLogin config={stytchLoginConfig} styles={stytchStyles}/>
                        {/* Optional: Add Forgot Password link if not using Stytch default */}
                        {/* <div className="mt-4 text-center">
                            <a href="/reset-password" className="link link-hover text-sm">Forgot Password?</a>
                        </div> */}
                    </div>
                </div>
            </div>
        </main>
    );
}