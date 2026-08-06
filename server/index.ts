import express, { type Request, Response, NextFunction } from "express";

const app = express();
let httpServer: any = null;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Trust proxy for secure cookies
app.set("trust proxy", 1);

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Em produção, permitir apenas origens específicas se necessário
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://gestaofinanceira-indol.vercel.app']
    : ['*'];

  const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
    return;
  }

  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

let isInitialized = false;
let initError: Error | null = null;
let initPromise: Promise<void> | null = null;

// Lightweight health route required by Render.com healthCheckPath
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Diagnostic health-check route (always available, before init middleware)
app.get("/api/health-check", async (req, res) => {
  let dbStatus = "unknown";
  let dbUrlInfo = "missing";
  
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const isPort6543 = url.includes(":6543");
    const isPort5432 = url.includes(":5432");
    dbUrlInfo = isPort6543 ? "Port 6543 (Pooler)" : (isPort5432 ? "Port 5432 (Direct)" : "Unknown Port");
  }

  try {
    if (isInitialized) {
      const { db } = await import("./db");
      if (db) {
        const { sql } = await import("drizzle-orm");
        // Adiciona um timeout explícito de 5 segundos para a query não travar o Vercel
        const queryPromise = db.execute(sql`SELECT 1`);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout 5s")), 5000));
        
        await Promise.race([queryPromise, timeoutPromise]);
        dbStatus = "connected";
      } else {
        dbStatus = "null - DATABASE_URL missing or invalid";
      }
    } else {
      dbStatus = "not yet initialized";
    }
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  res.json({
    status: "alive",
    isInitialized,
    hasError: !!initError,
    error: initError?.message,
    dbStatus,
    dbUrlInfo,
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
    },
    time: new Date().toISOString(),
  });
});

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        log("Starting application initialization...");

        // Dynamic imports without explicit .js extensions for better compatibility
        log("Importing modules...");
        const storageModule = await import("./storage");
        const { storage } = storageModule;
        const authModule = await import("./auth");
        const { setupAuth } = authModule;
        const routesModule = await import("./routes");
        const { registerRoutes } = routesModule;

        // 1. Verificar se o banco de dados está disponível
        log("Checking database availability...");
        const { db } = await import("./db");
        if (!db) {
          const errMsg = `DATABASE_URL não está configurada ou a conexão falhou. Verifique as variáveis de ambiente no Vercel.`;
          log(`❌ ${errMsg}`);
          // Não jogar um erro — registrar mas continuar para que auth e rotas sejam registradas
          // Assim o health-check ainda funciona e mostra o diagnóstico correto
          console.error("[Init] DB is null — all database operations will fail!");
        } else {
          log("✓ Database module loaded");
        }

        // 2. Initialize Database Schema (skip heavy init on serverless)
        try {
          if (process.env.VERCEL || process.env.NETLIFY) {
            log("Serverless env: skipping heavy DB init on boot.");
          } else {
            log("Initializing database schema...");
            const { createServer } = await import("http");
            httpServer = createServer(app);

            await (storage as any).initializeDatabase?.().catch((e: any) =>
              log(`⚠ DB Init skipped: ${e.message}`)
            );
            await storage.seedDefaultData().catch((e: any) =>
              log(`⚠ Seeding skipped: ${e.message}`)
            );
          }
        } catch (dbErr: any) {
          log(`⚠ Database initialization skipped: ${dbErr.message}`);
        }

        // 2. Setup Auth (Sessions, Passport)
        log("Setting up authentication...");
        await setupAuth(app);
        log("✓ Auth setup completed");

        // 3. Register API Routes
        log("Registering routes...");
        registerRoutes(httpServer, app);
        log("✓ Routes registered");

        // 4. Static files (only in non-serverless environments)
        if (!process.env.VERCEL && !process.env.NETLIFY) {
          if (app.get("env") === "development") {
            const { setupVite } = await import("./vite");
            await setupVite(httpServer!, app);
          } else {
            const { serveStatic } = await import("./static");
            serveStatic(app);
          }
        }

        isInitialized = true;
        log("✓ Application fully initialized");
      } catch (err: any) {
        log(`❌ Critical error during initialization: ${err.message}`);
        console.error(err);
        initError = err;
      }
    })();
  }
  return initPromise;
}

// Middleware to ensure server is initialized before handling real requests
app.use(async (req, res, next) => {
  // Ignorar health-check da inicialização para evitar loop
  if (req.path === "/api/health-check" || req.path === "/health") {
    return next();
  }

  if (initError) {
    console.error("[Server Init Error] Request blocked:", initError);
    return res.status(500).json({
      error: "Erro na inicialização do servidor",
      details: initError.message,
      stack: process.env.NODE_ENV === "development" ? initError.stack : undefined
    });
  }

  if (!isInitialized) {
    try {
      log(`Incoming request ${req.path} before init, ensuring initialization...`);
      await ensureInitialized();
      if (initError) throw initError;
    } catch (err: any) {
      console.error("[Server Init Fallback Error]:", err);
      return res.status(500).json({
        error: "Falha na inicialização",
        details: err.message,
      });
    }
  }
  next();
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${status} - ${message}`, err);
  res.status(status).json({ message, details: err.message });
});

export { app, httpServer };

// Only listen for HTTP connections in non-serverless environments
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL && !process.env.NETLIFY) {
  (async () => {
    try {
      // Test database connection
      try {
        const { db } = await import("./db.js");
        const { sql } = await import("drizzle-orm");
        if (db) {
          await db.execute(sql`SELECT 1`);
          log("✓ Database connected successfully");
        }
      } catch (err) {
        log(`✗ Database connection test failed: ${err}`);
      }

      await ensureInitialized();

      const port = parseInt(process.env.PORT || "5001", 10);
      httpServer?.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } catch (err) {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  })();
}
