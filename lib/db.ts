// src/lib/db.ts (create this file if it doesn't exist)
import { Pool } from 'pg';

let pool: Pool | null = null;

const getDbPool = (): Pool => {
    if (!pool) {
        if (!process.env.POSTGRES_URL) {
            throw new Error("POSTGRES_URL environment variable is not set.");
        }
        console.log('Creating new DB connection pool...'); // Log pool creation
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
             // Add SSL configuration if required by Neon (check their docs)
             // ssl: {
             //   rejectUnauthorized: false // Often needed for free tiers/local dev
             // }
        });

        // Optional: Add listeners for errors or client acquisition
        pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err);
            // You might want to terminate the process or take other actions
            // process.exit(-1);
        });
    }
    return pool;
};

export default getDbPool;