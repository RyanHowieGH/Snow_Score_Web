// app/login/page.js
'use client';

import React from 'react';
import { StytchLogin } from '@stytch/nextjs/ui'; // Import Stytch UI Component
import { Products } from '@stytch/vanilla-js'; // Import Products enum
import BlankHeader from "../../components/blankHeader";
import { useRouter } from 'next/navigation';

// Configuration for the Stytch Login component
const config = {
    products: [Products.emailMagicLinks, Products.passwords], // Allow Email + Password login
    emailMagicLinksOptions: {
        loginRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/authenticate`, // URL Stytch redirects to after login/signup
        signupRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/authenticate`,
    },
    passwordOptions: {
        loginRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/authenticate`,
        signupRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/authenticate`,
        resetPasswordRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password` // Need to create this page
    },
    // Add session options if needed
    // sessionOptions: { sessionDurationMinutes: 60*24*7 } // e.g., 1 week
};

// Styles for the Stytch component (optional, customize as needed)
const styles = {
     container: { width: '100%' }, // Make it fill the card
     buttons: { primary: { backgroundColor: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' } } // Example styling
};


export default function LoginPage() {
    const router = useRouter();

    // Use a callback to handle successful authentication if needed,
    // though redirect URLs handle most cases.
    const handleAuthSuccess = () => {
         console.log('Stytch authentication successful, redirecting...');
         // Stytch redirects via configured URLs, but we can refresh
         // router.refresh();
         // router.push('/admin'); // Or push manually
    };

    return (
        <main className="flex flex-col min-h-screen bg-gray-100">
            <BlankHeader/>
            <div className="flex flex-grow items-center justify-center p-4">
                <div className="card bg-primary w-full max-w-md shadow-sm text-primary-content">
                    <div className="card-body items-center"> {/* Center content */}
                         <h2 className="card-title mb-4">Sign In or Sign Up</h2>
                        <StytchLogin
                            config={config}
                            styles={styles}
                            // callbacks={{ onSuccess: handleAuthSuccess }} // Optional callback
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}