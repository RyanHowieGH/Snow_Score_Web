// lib/db.ts
import { Pool, PoolClient } from 'pg'; // Import PoolClient type for clarity

let pool: Pool | null = null;

const getDbPool = (): Pool => {
    if (!pool) {
        if (!process.env.POSTGRES_URL) {
            throw new Error("POSTGRES_URL environment variable is not set.");
        }
        console.log('Creating new DB connection pool...');
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
            // ssl: { rejectUnauthorized: false } // Uncomment if needed
        });

        // Optional: Add listeners for errors or client acquisition
        // The second argument 'client' is the specific client that errored
        pool.on('error', (err: Error, client: PoolClient) => { // Add types for clarity
            // --- REMOVED reference to client.processID ---
            // Log the error. You still *have* the client object if you needed
            // to attempt specific actions on it, but don't assume properties like processID.
            console.error('Unexpected error on idle client:', err);
            console.error('Client that errored:', client);
            // --- END REMOVAL ---

            // Optional: Terminate the process if pool errors are critical
            // process.exit(-1);
        });
        console.log('DB connection pool created.');
    }
    return pool;
};

export default getDbPool;