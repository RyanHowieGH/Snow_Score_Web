// lib/stytch/serverClient.ts
import * as stytch from 'stytch'; // Import the Stytch Node library

// Ensure environment variables are loaded (typically done automatically by Next.js)
const stytchProjectId = process.env.STYTCH_PROJECT_ID;
const stytchSecret = process.env.STYTCH_SECRET;
// Determine environment based on keys or explicitly set via another env var if needed
// const stytchEnv = process.env.STYTCH_ENV === 'live' ? stytch.envs.live : stytch.envs.test;

// Validate required environment variables
if (!stytchProjectId) {
  throw new Error("Missing Stytch Project ID (STYTCH_PROJECT_ID) in environment variables.");
}
if (!stytchSecret) {
  throw new Error("Missing Stytch Secret (STYTCH_SECRET) in environment variables.");
}


// Use a variable scoped to the module to hold the singleton client instance
let client: stytch.Client | null = null;

/**
 * Initializes and returns a singleton instance of the Stytch Node SDK client.
 * Uses environment variables STYTCH_PROJECT_ID and STYTCH_SECRET.
 * Throws an error if environment variables are missing.
 * IMPORTANT: This client uses the SECRET KEY and should ONLY be used in server-side code
 * (Server Components, Server Actions, API Routes) where secrets are safe.
 *
 * @returns {stytch.Client} The initialized Stytch Node client instance.
 */
// --- Added 'export' keyword ---
export const getStytchServerClient = (): stytch.Client => {
  if (!client) {
    // Create the client instance if it doesn't exist yet
    client = new stytch.Client({
      project_id: stytchProjectId, // Use validated env var
      secret: stytchSecret,         // Use validated env var
      // environment: stytchEnv,    // Optionally set environment
    });
    console.log("Initialized Stytch Server Client."); // Log initialization once
  }
  // Return the singleton instance
  return client;
};

// You could potentially add other server-side Stytch utility functions here if needed