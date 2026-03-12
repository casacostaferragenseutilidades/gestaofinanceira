import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.warn("[DB] WARNING: DATABASE_URL is not defined in environment variables!");
} else {
  console.log("[DB] DATABASE_URL is defined, trying to connect...");
}

export const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
