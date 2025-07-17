// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, UserJSON } from '@clerk/nextjs/server';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';

const DEFAULT_NEW_USER_ROLE_ID = 6;

interface UserPublicMetadata {
  initial_role_id?: number;
}

export async function POST(req: Request) {
  console.log('Clerk Webhook received');

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

  const payload = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
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

  const eventType = evt.type;
  const eventData = evt.data;

  if (!('id' in eventData) || typeof eventData.id !== 'string') {
       console.error('Webhook Error: Event data is missing expected string ID field.', eventData);
       return new Response('Error occurred: Invalid event data payload', { status: 400 });
  }
  const authProviderId = eventData.id;

  const pool = getDbPool();
  let client: PoolClient | null = null;

  try {
    if (eventType === 'user.created') {
      console.log(`Processing user.created event for Clerk ID: ${authProviderId}`);
      const userData = eventData as UserJSON;

      const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address
                     || userData.email_addresses.find(e => e.verification?.status === 'verified')?.email_address
                     || userData.email_addresses[0]?.email_address;

      // Get first_name and last_name directly from userData
      const firstName = userData.first_name || ''; // Provide a default if null/undefined
      const lastName = userData.last_name || '';   // Provide a default if null/undefined

      if (!email) {
           console.error(`User created webhook (${authProviderId}): Missing email address.`);
           return new Response('Webhook processed (user created event missing email)', { status: 200 });
      }

      let assignedRoleId = DEFAULT_NEW_USER_ROLE_ID;
      const publicMetadata = userData.public_metadata as UserPublicMetadata;
      if (publicMetadata?.initial_role_id && typeof publicMetadata.initial_role_id === 'number') {
          assignedRoleId = publicMetadata.initial_role_id;
      }

      client = await pool.connect();
      // MODIFIED INSERT QUERY AND PARAMETERS
      const insertQuery = `
        INSERT INTO ss_users (first_name, last_name, email, role_id, auth_provider_user_id)
        VALUES ($1, $2, $3, $4, $5)
        -- Prioritize checking for an existing user by their unique Clerk ID.
        ON CONFLICT (auth_provider_user_id) 
        -- If the Clerk ID already exists, do nothing, as they are already linked.
        DO NOTHING;
      `;
      const result = await client.query(insertQuery, [
        firstName,
        lastName,
        email.toLowerCase(),
        assignedRoleId,
        authProviderId,
      ]);

      const rowsAffected = result?.rowCount ?? 0;
      if (rowsAffected > 0) {
           console.log(`Successfully linked Clerk user ${authProviderId} (Name: ${firstName} ${lastName}) to ss_users with role ID ${assignedRoleId}.`);
      } else {
           console.log(`Clerk user ${authProviderId} was already linked or email conflict occurred (rowCount: ${rowsAffected}).`);
      }
    }
    else if (eventType === 'user.updated') {
         console.log(`Processing user.updated event for Clerk ID: ${authProviderId}`);
         const userData = eventData as UserJSON;

         const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address;
         const firstName = userData.first_name || null; // Use null if not provided, to potentially clear it if DB allows
         const lastName = userData.last_name || null;  // Use null if not provided

         // Proceed if email is present (assuming email is critical)
         // You might want to update names even if email hasn't changed,
         // or only update if specific fields (like name or email) have changed.
         // Clerk's `evt.data.previous_attributes` could be used for more fine-grained checks if needed.
         if (email) {
              client = await pool.connect();
              // MODIFIED UPDATE QUERY AND PARAMETERS
              // This query updates first_name, last_name, and email if they are provided.
              // If firstName or lastName from Clerk is null/empty, it will set them to null/empty in DB.
              // Adjust COALESCE if you want to keep old values if new ones are null.
              const updateQuery = `
                UPDATE ss_users
                SET first_name = $1, last_name = $2, email = $3
                WHERE auth_provider_user_id = $4;
              `;
              const updateResult = await client.query(updateQuery, [
                firstName,
                lastName,
                email.toLowerCase(),
                authProviderId
              ]);
              console.log(`Attempted to update ss_users for ${authProviderId}. Rows affected: ${updateResult?.rowCount ?? 0}`);
         } else {
             console.warn(`Skipping ss_users update for ${authProviderId} due to missing primary email.`);
         }
    }
    else if (eventType === 'user.deleted') {
         console.log(`Processing user.deleted event for Clerk ID: ${authProviderId}`);
         // Depending on your FK constraints (ON DELETE SET NULL, CASCADE, etc.) or business logic,
         // you might delete the user from ss_users or mark them as inactive.
         // For now, just logging.
         // Example:
         // client = await pool.connect();
         // await client.query("DELETE FROM ss_users WHERE auth_provider_user_id = $1", [authProviderId]);
         // console.log(`User ${authProviderId} deleted from ss_users.`);
    }
    else {
         console.log(`Webhook received: Unhandled event type ${eventType}`);
    }

    return new Response('', { status: 200 });

  } catch (dbError) {
    console.error(`Database error processing webhook event ${eventType} for ${authProviderId || 'unknown ID'}:`, dbError);
    return new Response('Error occurred: Database operation failed', { status: 500 });
  } finally {
    if (client) {
        client.release();
    }
  }
}