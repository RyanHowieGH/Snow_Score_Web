// lib/db.ts
import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

const getDbPool = (): Pool => {
    if (!pool) {
        if (!process.env.POSTGRES_URL) {
            throw new Error("POSTGRES_URL environment variable is not set.");
        }
        console.log('Creating new DB connection pool...');
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
        });

        pool.on('error', (err: Error, client: PoolClient) => { // Add types for clarity
            console.error('Unexpected error on idle client:', err);
            console.error('Client that errored:', client);
        });
        console.log('DB connection pool created.');
    }
    return pool;
};

export default getDbPool;