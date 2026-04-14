import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

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
      max: 3, // Reduzido para serverless (evitar exceder limite de conexões)
      min: 1, // Manter pelo menos 1 conexão
      idleTimeoutMillis: 30000, // Fechar conexões inativas após 30s
      connectionTimeoutMillis: 10000, // 10s para conectar
      acquireTimeoutMillis: 60000, // 60s para adquirir conexão do pool
      createTimeoutMillis: 30000, // 30s para criar nova conexão
      destroyTimeoutMillis: 5000, // 5s para destruir conexão
      reapIntervalMillis: 1000, // Verificar conexões idle a cada 1s
      createRetryIntervalMillis: 200, // Retry rápido para criar conexões
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
