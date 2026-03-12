import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "";

let pool: pg.Pool | null = null;
let db: any = null;

if (connectionString) {
  try {
    console.log("[DB] DATABASE_URL detected, creating pool...");
    pool = new pg.Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 5000, // 5s timeout
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client', err);
    });

    db = drizzle(pool, { schema });
    console.log("[DB] Drizzle initialized");
  } catch (err: any) {
    console.error("[DB] Fatal error during database initialization:", err.message);
    pool = null;
    db = null;
  }
} else {
  console.warn("[DB] WARNING: DATABASE_URL is not defined!");
}

export { pool, db };
