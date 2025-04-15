// components/ClientSideAuthWrapper.tsx
'use client'; // This component provides context, must be a Client Component

import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the user data made available to client components
// This should match the structure of 'clientSafeUser' created in AdminLayout
export interface ClientUser {
    id: string; // Clerk User ID (authProviderId)
    app_user_id: number; // Your internal ss_users ID
    email?: string; // Clerk might not always expose email depending on settings
    app_user_name: string; // Name from ss_users
    role_name: string; // Role from ss_roles
    firstName?: string | null; // Clerk first name (optional)
    lastName?: string | null; // Clerk last name (optional)
}

// Create the context
const AuthContext = createContext<ClientUser | null>(null);

/**
 * Custom hook to easily access the authenticated user's data
 * (filtered for client-side safety) within client components
 * wrapped by ClientSideAuthWrapper.
 * Returns null if the user is not authenticated or outside the provider.
 */
export function useAuth() {
    return useContext(AuthContext);
}

// Define props for the wrapper component
interface ClientSideAuthWrapperProps {
    children: ReactNode;
    initialUser: ClientUser | null; // User data passed from the server layout
}

/**
 * A Client Component that sets up a React Context to provide
 * client-safe authenticated user data (passed from a Server Component layout)
 * to its children components via the `useAuth` hook.
 */
export default function ClientSideAuthWrapper({ children, initialUser }: ClientSideAuthWrapperProps) {
    // The core logic is simply providing the value received from the server.
    // More complex scenarios might involve listening for real-time auth changes here,
    // but for passing initial server-fetched data, this is sufficient.
    return (
        <AuthContext.Provider value={initialUser}>
            {children}
        </AuthContext.Provider>
    );
}