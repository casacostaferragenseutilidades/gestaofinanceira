import "dotenv/config";
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";

console.log("[Server] Modules loaded, initializing application...");

const app = express();
const httpServer = process.env.VERCEL ? null : createServer(app);

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

const initPromise = (async () => {
  try {
    await setupAuth(app);
    log("✓ Auth setup completed");

    registerRoutes(httpServer!, app);
    log("✓ Routes registered");

    isInitialized = true;
  } catch (err: any) {
    log(`✗ Critical error during initialization: ${err}`);
    initError = err;
    throw err;
  }
})();

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
      await initPromise;
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

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  (async () => {
    try {
      // Test database connection
      try {
        await db.execute(sql`SELECT 1`);
        log("✓ Database connected successfully");
      } catch (err) {
        log(`✗ Database connection failed: ${err}`);
      }

      // Inicializar banco de dados e semear dados de forma segura
      try {
        await storage.initializeDatabase();
        log("✓ Database initialized successfully");
        await storage.seedDefaultData();
        log("✓ Default data seeded successfully");
      } catch (err) {
        log(`⚠ Database initialization/seeding skipped: ${err}`);
      }

      const port = parseInt(process.env.PORT || "5001", 10);
      httpServer.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } catch (err) {
      log(`Fatal error during startup: ${err}`);
      process.exit(1);
    }
  })();
}
