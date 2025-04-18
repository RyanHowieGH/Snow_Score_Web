// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, UserJSON } from '@clerk/nextjs/server'; // Import Clerk server types
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';

// Define a default role ID for new users IF no role metadata is found in the webhook.
const DEFAULT_NEW_USER_ROLE_ID = 6; // Example: Role ID for 'Volunteer' or 'Coach'

interface UserPublicMetadata {
  initial_role_id?: number;
}

export async function POST(req: Request) {
  console.log('Clerk Webhook received');

  // --- 1. Webhook Verification ---
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('CRITICAL: CLERK_WEBHOOK_SIGNING_SECRET environment variable is not set.');
    return new Response('Error occurred: Server configuration error', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Webhook verification failed: Missing required svix headers.');
    return new Response('Error occurred: Missing svix headers', { status: 400 });
  }

  // Read the raw request body as text for svix verification
  const payload = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    // Verify the payload against the svix headers
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log(`Webhook verified: Event type ${evt.type}`);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Error occurred: Verification failed', { status: 400 });
  }
  // --- End Verification ---

  // --- 2. Handle Specific Event Types ---
  const eventType = evt.type;
  const eventData = evt.data;

  // Check if event data contains an ID (expected for user events)
  if (!('id' in eventData) || typeof eventData.id !== 'string') {
       console.error('Webhook Error: Event data is missing expected string ID field.', eventData);
       return new Response('Error occurred: Invalid event data payload', { status: 400 });
  }
  const authProviderId = eventData.id; // Clerk User ID

  const pool = getDbPool();
  let client: PoolClient | null = null;

  try {
    // --- Handle user.created ---
    if (eventType === 'user.created') {
      console.log(`Processing user.created event for Clerk ID: ${authProviderId}`);
      const userData = eventData as UserJSON; // Cast data

      // Extract email (primary or first verified)
      const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address
                     || userData.email_addresses.find(e => e.verification?.status === 'verified')?.email_address
                     || userData.email_addresses[0]?.email_address;

      // Construct name
      const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || email; // Fallback to email

      if (!email) {
           console.error(`User created webhook (${authProviderId}): Missing email address.`);
           return new Response('Webhook processed (user created event missing email)', { status: 200 });
      }

      // ---> Determine Role ID (Check metadata first, then default) <---
      let assignedRoleId = DEFAULT_NEW_USER_ROLE_ID; // Start with default
      const publicMetadata = userData.public_metadata as UserPublicMetadata; // Cast metadata
      if (publicMetadata?.initial_role_id && typeof publicMetadata.initial_role_id === 'number') {
          assignedRoleId = publicMetadata.initial_role_id;
          console.log(`Webhook: Found initial_role_id ${assignedRoleId} in public metadata for ${authProviderId}.`);
      } else {
           console.log(`Webhook: No initial role metadata found for ${authProviderId}, using default role ${DEFAULT_NEW_USER_ROLE_ID}.`);
      }
      // ---> End Role ID Determination <---

      // Insert into ss_users table
      client = await pool.connect();
      const insertQuery = `
        INSERT INTO ss_users (name, email, role_id, auth_provider_user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (auth_provider_user_id) DO NOTHING -- If Clerk ID already exists, ignore
        ON CONFLICT (email) DO NOTHING; -- If email already exists, ignore
      `;
      const result = await client.query(insertQuery, [
        name,
        email.toLowerCase(), // Store email consistently
        assignedRoleId, // Use determined role ID
        authProviderId,
      ]);

      const rowsAffected = result?.rowCount ?? 0;
      if (rowsAffected > 0) {
           console.log(`Successfully linked Clerk user ${authProviderId} to ss_users with role ID ${assignedRoleId}.`);
      } else {
           console.log(`Clerk user ${authProviderId} was already linked or email conflict occurred (rowCount: ${rowsAffected}).`);
      }
    }
    // --- Handle user.updated ---
    else if (eventType === 'user.updated') {
         console.log(`Processing user.updated event for Clerk ID: ${authProviderId}`);
         const userData = eventData as UserJSON;

         // Example: Update name and primary email if they changed
         const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address;
         const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || email;

         if (email && name) {
              client = await pool.connect();
              const updateQuery = `
                UPDATE ss_users
                SET name = $1, email = $2
                WHERE auth_provider_user_id = $3;
              `;
              const updateResult = await client.query(updateQuery, [name, email.toLowerCase(), authProviderId]);
              console.log(`Attempted to update ss_users name/email for ${authProviderId}. Rows affected: ${updateResult?.rowCount ?? 0}`);
         } else {
             console.warn(`Skipping ss_users update for ${authProviderId} due to missing name or email.`);
         }
    }
    // --- Handle user.deleted ---
    else if (eventType === 'user.deleted') {
         console.log(`Processing user.deleted event for Clerk ID: ${authProviderId}`);
         console.log(`User deletion event received for ${authProviderId}. Action depends on FK/sync behavior.`);
    }
    // --- Handle other events if needed ---
    else {
         console.log(`Webhook received: Unhandled event type ${eventType}`);
    }

    // Acknowledge successful processing of the webhook to Clerk
    return new Response('', { status: 200 });

  } catch (dbError) {
    // Catch any database errors during processing
    console.error(`Database error processing webhook event ${eventType} for ${authProviderId || 'unknown ID'}:`, dbError);
    // Return 500 so Clerk might retry
    return new Response('Error occurred: Database operation failed', { status: 500 });
  } finally {
    // Ensure database client is always released
    if (client) {
        client.release();
    }
  }
}