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

// Trust proxy for secure cookies on Render
app.set("trust proxy", 1);

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
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

// Basic middleware
app.get("/api/raw-health", (req, res) => {
  res.json({ status: "alive", time: new Date().toISOString() });
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    log(`${req.method} ${req.path}`);
  }
  next();
});

// Flag and promise for initialization
let isInitialized = false;
let initError: Error | null = null;

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        log("DEBUG: Starting dummy initialization...");
        
        /* Commenting out to isolate crash
        // Dynamic imports to prevent top-level boot crashes
        const { storage } = await import("./storage");
        const { setupAuth } = await import("./auth");
        const { registerRoutes } = await import("./routes");
        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");
        const { serveStatic } = await import("./static");

        // 1. Initialize Database Schema (Only if on Vercel or needed)
        try {
          if (process.env.VERCEL || process.env.NETLIFY) {
            log("Environment is serverless, skipping heavy DB init on boot to avoid timeout.");
            // We'll trust the DB is either ready or will be initialized lazily elsewhere
          } else {
            log("Initializing database schema...");
            await storage.initializeDatabase().catch(e => log(`⚠ DB Init skipped: ${e.message}`));
            await storage.seedDefaultData().catch(e => log(`⚠ Seeding skipped: ${e.message}`));
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

        if (app.get("env") === "development" && !process.env.NETLIFY && !process.env.VERCEL) {
          const { setupVite } = await import("./vite");
          await setupVite(httpServer!, app);
        } else if (!process.env.VERCEL && !process.env.NETLIFY) {
          serveStatic(app);
        }
        */

        isInitialized = true;
        log("✓ Dummy Initialization completed");
      } catch (err: any) {
        log(`❌ Critical error during initialization: ${err.message}`);
        console.error(err);
        initError = err;
      }
    })();
  }
  return initPromise;
}

app.get("/api/health-check", (req, res) => {
  res.json({ 
    status: "alive", 
    isInitialized, 
    hasError: !!initError,
    error: initError?.message 
  });
});

// Middleware to ensure server is initialized
app.use(async (req, res, next) => {
  if (initError) {
    return res.status(500).json({
      error: "Erro na inicialização do servidor",
      details: initError.message,
      stack: initError.stack
    });
  }

  if (!isInitialized) {
    try {
      await ensureInitialized();
    } catch (err: any) {
      return res.status(500).json({
        error: "Falha na inicialização",
        details: err.message
      });
    }
  }
  next();
});

// Error handling middleware (should be after routes)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${status} - ${message}`, err);
  res.status(status).json({
    message,
    details: err.message,
    stack: err.stack
  });
});

export { app, httpServer };

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL && !process.env.NETLIFY) {
  (async () => {
    try {
      // Test database connection immediately
      try {
        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");
        if (db) {
          await db.execute(sql`SELECT 1`);
          log("✓ Database connection test passed");
        }
      } catch (err) {
        log(`✗ Database connection test failed: ${err}`);
      }

      await initPromise;

      const port = parseInt(process.env.PORT || "5001", 10);
      httpServer?.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } catch (err) {
      log(`Fatal error durante o startup: ${err}`);
      process.exit(1);
    }
  })();
}
