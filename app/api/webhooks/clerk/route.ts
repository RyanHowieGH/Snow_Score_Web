// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, UserJSON } from '@clerk/nextjs/server';
import getDbPool from '@/lib/db';
import { PoolClient } from 'pg';

const DEFAULT_NEW_USER_ROLE_ID = 6;

interface UserPublicMetadata {
  initial_role_id?: number;
  firstName?: string;
  lastName?: string;
}

export async function POST(req: Request) {
  console.log('Clerk Webhook received');

  // --- Webhook Verification ---
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('CRITICAL: CLERK_WEBHOOK_SIGNING_SECRET environment variable is not set.');
    return new Response('Error occurred: Server configuration error', { status: 500 });
  }

  // [FIX 1] Added `await` to the headers() call
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
  // --- End Verification ---

  const eventType = evt.type;
  const eventData = evt.data;
  if (!('id' in eventData) || typeof eventData.id !== 'string') {
       console.error('Webhook Error: Event data is missing expected string ID field.', eventData);
       return new Response('Error occurred: Invalid event data payload', { status: 400 });
  }
  const authProviderId = eventData.id;
  console.log(`[WEBHOOK] Received event '${eventType}' for Clerk ID: ${authProviderId}`);

  const pool = getDbPool();
  let client: PoolClient | null = null;

  try {
    if (eventType === 'user.created') {
    const userData = eventData as UserJSON;
    console.log(`Processing user.created event for Clerk ID: ${authProviderId}`);

    const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address
                   || userData.email_addresses.find(e => e.verification?.status === 'verified')?.email_address
                   || userData.email_addresses[0]?.email_address;
    if (!email) {
         console.error(`User created webhook (${authProviderId}): Missing email address.`);
         return new Response('Webhook processed (user created event missing email)', { status: 200 });
    }

    const publicMetadata = userData.public_metadata as UserPublicMetadata;
    const firstName = publicMetadata?.firstName || userData.first_name || '';
    const lastName = publicMetadata?.lastName || userData.last_name || '';
    const assignedRoleId = publicMetadata?.initial_role_id || DEFAULT_NEW_USER_ROLE_ID;

    console.log('--- [WEBHOOK DEBUG `user.created`] DATA FOR UPSERT ---');
    console.log('Final First Name:', firstName);
    console.log('Final Last Name:', lastName);
    console.log('Assigned Role ID:', assignedRoleId);

    client = await pool.connect();
    
    // --- THIS IS THE FINAL, CORRECTED UPSERT (INSERT OR UPDATE) QUERY ---
    const upsertQuery = `
      INSERT INTO ss_users (auth_provider_user_id, email, first_name, last_name, role_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (auth_provider_user_id) 
      DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role_id = EXCLUDED.role_id;
    `;
    
    // We switched the order of parameters to match the new query
    const result = await client.query(upsertQuery, [
      authProviderId, 
      email.toLowerCase(), 
      firstName, 
      lastName, 
      assignedRoleId
    ]);
    
    if ((result?.rowCount ?? 0) > 0) {
         console.log(`Successfully UPSERTED (created or updated) user ${authProviderId} (Name: ${firstName} ${lastName}).`);
    } else {
         // This block should ideally not be hit, but it's good for logging.
         console.log(`UPSERT operation for user ${authProviderId} resulted in no change.`);
    }
    
    } else if (eventType === 'user.updated') {
  const userData = eventData as UserJSON;
  console.log(`Processing user.updated event for Clerk ID: ${authProviderId}`);

  const email = userData.email_addresses.find(e => e.id === userData.primary_email_address_id)?.email_address;
  if (!email) {
      console.warn(`Skipping ss_users update for ${authProviderId} due to missing primary email.`);
      return new Response('Webhook processed (user updated event missing email)', { status: 200 });
  }

  const publicMetadata = userData.public_metadata as UserPublicMetadata;
  const firstName = publicMetadata?.firstName || userData.first_name || '';
  const lastName = publicMetadata?.lastName || userData.last_name || '';
  
  console.log('--- [WEBHOOK DEBUG `user.updated`] DATA RECEIVED FOR UPDATE ---');
  console.log('First Name from payload:', firstName);
  console.log('Last Name from payload:', lastName);

  client = await pool.connect();

  // --- THIS IS THE FINAL, CORRECTED QUERY ---
  const updateQuery = `
    UPDATE ss_users
    SET 
      first_name = COALESCE(NULLIF($1, ''), first_name),
      last_name = COALESCE(NULLIF($2, ''), last_name),
      email = $3
    WHERE auth_provider_user_id = $4;
  `;
  
  const updateResult = await client.query(updateQuery, [
    firstName, 
    lastName, 
    email.toLowerCase(), 
    authProviderId
  ]);
  
  if ((updateResult?.rowCount ?? 0) > 0) {
      console.log(`Successfully ran defensive update for user ${authProviderId}.`);
  } else {
      console.log(`User ${authProviderId} not found for update, or data was unchanged.`);
  }

    
    } else if (eventType === 'user.deleted') {
      console.log(`Processing user.deleted event for Clerk ID: ${authProviderId}`);
      client = await pool.connect();
      const deleteResult = await client.query("DELETE FROM ss_users WHERE auth_provider_user_id = $1", [authProviderId]);
      
      // [FIX 2] Safely access rowCount
      if ((deleteResult?.rowCount ?? 0) > 0) {
        console.log(`User ${authProviderId} deleted from ss_users.`);
      } else {
        console.log(`User ${authProviderId} not found in ss_users for deletion.`);
      }

    } else {
      console.log(`Webhook received: Unhandled event type ${eventType}`);
    }

    return new Response('', { status: 200 });

  } catch (dbError) {
    console.error(`[WEBHOOK] Database error on event '${eventType}' for Clerk ID ${authProviderId}:`, dbError);
    return new Response('Error occurred: Database operation failed', { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}