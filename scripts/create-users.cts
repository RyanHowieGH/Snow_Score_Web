// scripts/create-users.ts

// --- VVV THIS IS THE CORRECT IMPORT STATEMENT VVV ---
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { config } from 'dotenv';
import getDbPool from '../lib/db';

config({ path: '.env.local' });

// --- CONFIGURATION ---
const BATCH_PREFIX = 'testuser'; // A simple, clean prefix
const EMAIL_DOMAIN = 'snowscore.com';
const DEFAULT_ROLE_ID = 6;
const STARTING_PASSWORD = 'Password123!';

async function createTestUsers(count: number) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not defined in your environment variables.');
  }

  // --- VVV THIS IS THE CORRECT INITIALIZATION VVV ---
  const clerk = createClerkClient({ secretKey });

  console.log(`Starting batch creation of ${count} test users...`);
  const pool = getDbPool();
  const dbClient = await pool.connect();

  try {
    const creationPromises: Promise<void>[] = [];
    for (let i = 1; i <= count; i++) {
      const email = `${BATCH_PREFIX}${i}@${EMAIL_DOMAIN}`; // e.g., testuser1@snowscore.test
      const firstName = 'Test';
      const lastName = `User ${i}`; // Simpler last name as well

      const promise = async () => {
        try {
          // --- VVV NOW WE USE THE 'clerk' INSTANCE VVV ---
          const newUser = await clerk.users.createUser({
            emailAddress: [email],
            firstName: firstName,
            lastName: lastName,
            password: STARTING_PASSWORD,
          });
          console.log(`[Clerk] Created: ${email} (ID: ${newUser.id})`);

          await dbClient.query(
            `INSERT INTO ss_users (first_name, last_name, email, role_id, auth_provider_user_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [firstName, lastName, email, DEFAULT_ROLE_ID, newUser.id]
          );
          console.log(`[DB] Inserted: ${email}`);

        } catch (error: any) {
          console.error(`Failed to create user ${email}:`, error.errors?.[0]?.longMessage || error.message);
        }
      };
      creationPromises.push(promise());
    }

    await Promise.all(creationPromises);

  } catch (error) {
    console.error("A critical error occurred during batch creation:", error);
  } finally {
    dbClient.release();
    await pool.end();
    console.log(`\nBatch creation process finished.`);
  }
}

// ... (script execution logic remains the same)
const userCount = parseInt(process.argv[2], 10);
if (isNaN(userCount) || userCount <= 0) {
  console.error("Usage: ts-node scripts/create-users.ts <number_of_users>");
  console.error("Example: ts-node scripts/create-users.ts 20");
  process.exit(1);
}

createTestUsers(userCount);