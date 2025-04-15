// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, UserJSON } from '@clerk/nextjs/server'; // Correct import path if needed
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';

// Define a default role ID for new users. MUST EXIST IN ss_roles table.
const DEFAULT_NEW_USER_ROLE_ID = 6; // Example: Role ID for 'Volunteer' or 'Coach'

export async function POST(req: Request) {
  console.log('Clerk Webhook received');

  // --- 1. Webhook Verification ---
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('CRITICAL: CLERK_WEBHOOK_SIGNING_SECRET environment variable is not set.');
    return new Response('Error occurred: Server configuration error', { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Webhook verification failed: Missing required svix headers.');
    return new Response('Error occurred: Missing svix headers', { status: 400 });
  }

  // Read the raw request body for verification
  const payload = await req.text(); // Read as text for svix verification
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
  const eventData = evt.data; // Raw data, structure depends on eventType

  // Check if event data contains an ID (expected for user events)
  if (!('id' in eventData) || typeof eventData.id !== 'string') {
       console.error('Webhook Error: Event data is missing expected string ID field.', eventData);
       return new Response('Error occurred: Invalid event data payload', { status: 400 });
  }
  const authProviderId = eventData.id; // Use the ID consistently

  // Get DB connection (do this once if multiple event types need it)
  const pool = getDbPool();
  let client: PoolClient | null = null;

  try {
    // --- Handle user.created ---
    if (eventType === 'user.created') {
      console.log(`Processing user.created event for Clerk ID: ${authProviderId}`);
      // Cast data to UserJSON for user.created type
      const userData = eventData as UserJSON;

      // Extract necessary data (find primary/verified email)
      const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address
                     || userData.email_addresses.find(e => e.verification?.status === 'verified')?.email_address // Fallback to first verified
                     || userData.email_addresses[0]?.email_address; // Fallback to first email

      // Construct name (handle potential null values)
      const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || email; // Fallback to email

      if (!email) {
           console.error(`User created webhook (${authProviderId}): Missing email address.`);
           // Acknowledge webhook, but log error
           return new Response('Webhook processed (user created event missing email)', { status: 200 });
      }

      // Insert into your ss_users table
      client = await pool.connect();
      const insertQuery = `
        INSERT INTO ss_users (name, email, role_id, auth_provider_user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (auth_provider_user_id) DO NOTHING -- If Clerk ID already exists, ignore
        ON CONFLICT (email) DO NOTHING; -- If email already exists, ignore (consider update logic if needed)
      `;
      const result = await client.query(insertQuery, [
        name,
        email.toLowerCase(), // Store email consistently
        DEFAULT_NEW_USER_ROLE_ID, // Assign default role
        authProviderId,
      ]);

      // --- Use Nullish Coalescing for rowCount check ---
      const rowsAffected = result?.rowCount ?? 0;
      if (rowsAffected > 0) {
           console.log(`Successfully linked Clerk user ${authProviderId} to ss_users.`);
      } else {
           console.log(`Clerk user ${authProviderId} was already linked or email conflict occurred (rowCount: ${rowsAffected}).`);
      }
    }
    // --- Handle user.updated ---
    else if (eventType === 'user.updated') {
         console.log(`Processing user.updated event for Clerk ID: ${authProviderId}`);
         const userData = eventData as UserJSON; // Safe cast for user.updated

         // Example: Update name and primary email if they changed
         const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address;
         const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || email;

         if (email && name) { // Only update if we have valid data
              client = await pool.connect();
              const updateQuery = `
                UPDATE ss_users
                SET name = $1, email = $2
                WHERE auth_provider_user_id = $3;
              `;
               const updateResult = await client.query(updateQuery, [name, email.toLowerCase(), authProviderId]);
               console.log(`Attempted to update ss_users for ${authProviderId}. Rows affected: ${updateResult?.rowCount ?? 0}`);
         } else {
             console.warn(`Skipping ss_users update for ${authProviderId} due to missing name or email in webhook payload.`);
         }
         console.log('User update handling can be further customized.');
    }
    // --- Handle user.deleted ---
    else if (eventType === 'user.deleted') {
         console.log(`Processing user.deleted event for Clerk ID: ${authProviderId}`);
         // **Important:** Your foreign key constraint (`ON DELETE SET NULL` or `ON DELETE CASCADE`)
         // on `ss_users.auth_provider_user_id` referencing `neon_auth.users_sync(id)`
         // might handle deletion synchronization *automatically* if Neon Auth removes the user
         // from `neon_auth.users_sync` when Clerk deletes them. Verify this behavior.

         // If you need explicit deletion OR if using ON DELETE SET NULL and want to remove the row:
         // client = await pool.connect();
         // const deleteQuery = `DELETE FROM ss_users WHERE auth_provider_user_id = $1`;
         // const deleteResult = await client.query(deleteQuery, [authProviderId]);
         // console.log(`Attempted deletion from ss_users for Clerk ID ${authProviderId}. Rows affected: ${deleteResult?.rowCount ?? 0}`);

         console.log(`User deletion event received for ${authProviderId}. Action depends on FK constraints.`);
    }
    // --- Handle other events if needed ---
    else {
         console.log(`Webhook received: Unhandled event type ${eventType}`);
    }

    // Acknowledge successful processing of the webhook to Clerk
    return new Response('', { status: 200 });

  } catch (dbError) {
    // Catch database errors specifically
    console.error(`Database error processing webhook event ${eventType} for ${authProviderId || 'unknown ID'}:`, dbError);
    // Return 500 so Clerk might retry
    return new Response('Error occurred: Database operation failed', { status: 500 });
  } finally {
    // Ensure client is always released
    if (client) {
        client.release();
        console.log("Database client released.");
    }
  }
}