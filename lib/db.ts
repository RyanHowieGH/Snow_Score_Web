// lib/db.ts

import { PoolClient } from 'pg';
import pg from 'pg';
const { Pool } = pg;

// --- VVV IMPROVEMENT: Use separate pool variables for each database VVV ---
// This prevents one connection from overwriting the other.
let mainPool: pg.Pool | null = null;
let archivePool: pg.Pool | null = null;
// --- ^^^ END OF IMPROVEMENT ^^^ ---

/**
 * Gets a singleton instance of the main database connection pool.
 * @returns {pg.Pool} The main database pool.
 */
const getDbPool = (): pg.Pool => {
  if (!mainPool) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set.");
    }
    console.log('Creating new MAIN DB connection pool...');
    mainPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    mainPool.on('error', (err: Error, client: PoolClient) => {
      console.error('Unexpected error on idle MAIN client:', err);
    });
    console.log('MAIN DB connection pool created.');
  }
  return mainPool;
};

export default getDbPool;

/**
 * Gets a singleton instance of the ARCHIVE database connection pool.
 * @returns {pg.Pool} The archive database pool.
 */
const getArchiveDbPool = (): pg.Pool => {
  if (!archivePool) {
    if (!process.env.ARCHIVE_POSTGRES_URL) {
      throw new Error("ARCHIVE_POSTGRES_URL environment variable is not set.");
    }
    console.log('Creating new ARCHIVE DB connection pool...');
    archivePool = new Pool({
      connectionString: process.env.ARCHIVE_POSTGRES_URL,
    });

    archivePool.on('error', (err: Error, client: PoolClient) => {
      console.error('Unexpected error on idle ARCHIVE client:', err);
    });
    console.log('ARCHIVE DB connection pool created.');
  }
  return archivePool;
};

export { getArchiveDbPool };