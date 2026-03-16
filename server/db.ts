import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// No Vercel/Netlify, as variáveis de ambiente já são injetadas automaticamente.
// dotenv só é necessário localmente. O import estático foi removido para evitar
// falhas no ambiente serverless onde não existe arquivo .env.
if (!process.env.VERCEL && !process.env.NETLIFY) {
  try {
    // Tentativa opcional de carregar dotenv no ambiente local
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    require("dotenv").config();
  } catch {
    // É ok se falhar — as variáveis já podem estar no ambiente
  }
}

const connectionString = process.env.DATABASE_URL || "";

let pool: pg.Pool | null = null;
let db: any = null;

if (connectionString) {
  try {
    console.log("[DB] DATABASE_URL detected, creating pool...");
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ":***@");
    console.log(`[DB] Connecting to: ${maskedUrl}`);

    pool = new pg.Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5, // Reduzido para serverless (evitar exceder limite de conexões)
      idleTimeoutMillis: 10000, // Fechar conexões inativas após 10s
      connectionTimeoutMillis: 8000, // 8s para conectar
    });

    pool.on("error", (err) => {
      console.error("[DB] Unexpected error on idle client:", err.message);
    });

    pool.on("connect", () => {
      console.log("[DB] New client connected to database");
    });

    db = drizzle(pool, { schema });
    console.log("[DB] Drizzle ORM initialized successfully");
  } catch (err: any) {
    console.error("[DB] FATAL error during database initialization:", err.message);
    console.error("[DB] Stack:", err.stack);
    pool = null;
    db = null;
  }
} else {
  console.warn("[DB] WARNING: DATABASE_URL is not defined! All DB operations will fail.");
  console.warn("[DB] Please set DATABASE_URL in Vercel Environment Variables.");
}

export { pool, db };
