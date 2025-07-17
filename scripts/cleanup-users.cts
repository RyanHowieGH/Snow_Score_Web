// scripts/cleanup-users.ts
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { config } from 'dotenv';
import getDbPool from '../lib/db';

config({ path: '.env.local' });
const EMAIL_DOMAIN = 'snowscore.com';

async function cleanupTestUsers() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not defined.');
  }

  const clerk = createClerkClient({ secretKey });

  console.log(`Searching for test users with email domain @${EMAIL_DOMAIN}...`);
  const pool = getDbPool();
  const dbClient = await pool.connect();

  try {
    const { rows: usersToDelete } = await dbClient.query(
      "SELECT user_id, auth_provider_user_id, email FROM ss_users WHERE email LIKE $1",
      [`%@${EMAIL_DOMAIN}`]
    );

    if (usersToDelete.length === 0) {
      console.log("No test users found to delete. All clean!");
      // Release client and end pool before returning
      dbClient.release();
      await pool.end();
      return;
    }

    console.log(`Found ${usersToDelete.length} test users. Starting cleanup...`);

    const deletionPromises = usersToDelete.map(async (user) => {
      try {
        await clerk.users.deleteUser(user.auth_provider_user_id);
        console.log(`[Clerk] Deleted: ${user.email} (ID: ${user.auth_provider_user_id})`);

        await dbClient.query("DELETE FROM ss_users WHERE user_id = $1", [user.user_id]);
        console.log(`[DB] Deleted: ${user.email}`);

      } catch (error: any) {
        // ... (error handling)
      }
    });

    await Promise.all(deletionPromises);

  } catch (error) {
    console.error("A critical error occurred during cleanup:", error);
  } finally {
    dbClient.release();
    await pool.end();
    console.log(`\nCleanup process finished.`);
  }
}

cleanupTestUsers();