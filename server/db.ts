import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.warn("[DB] WARNING: DATABASE_URL is not defined!");
} else {
  console.log("[DB] DATABASE_URL detected, creating pool...");
}

export const pool = connectionString 
  ? new pg.Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
    })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null as any;
