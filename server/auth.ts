import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { User, UserRole } from "@shared/schema";
import { storage } from "./storage";
import { pool } from "./db";
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const parts = (stored || "").split(".");
    if (parts.length !== 2) {
      console.warn("[Auth] Password format invalid (missing salt)");
      return false;
    }
    const [hashed, salt] = parts;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    if (hashedBuf.length !== suppliedBuf.length) {
      console.warn("[Auth] Password length mismatch");
      return false;
    }

    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("[Auth] Error comparing passwords:", error);
    return false;
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      fullName: string | null;
      role: UserRole | string | null;
      status: string | null;
      team: string | null;
    }
  }
}

// function hashPassword and comparePasswords removed as they relied on local password storage


export async function setupAuth(app: Express): Promise<void> {
  let sessionStore: any;
  try {
    const usePgStore = false; // Forçar MemoryStore para evitar timeouts de conexão

    if (usePgStore) {
      console.log("[Auth] Attempting to use PostgreSQL session store...");
      try {
        const connectPgSimple = (await import("connect-pg-simple")).default;
        const PgSession = connectPgSimple(session);
        sessionStore = new PgSession({
          pool: pool as any,
          tableName: "user_sessions",
          createTableIfMissing: true,
          pruneSessionInterval: false,
        });
        console.log("[Auth] PostgreSQL session store configured");
      } catch (pgStoreErr: any) {
        console.warn("[Auth] Fallback to MemoryStore:", pgStoreErr.message);
        const MemoryStore = (await import("memorystore")).default(session);
        sessionStore = new MemoryStore({ checkPeriod: 86400000 });
      }
    } else {
      console.log("[Auth] Using MemoryStore for sessions");
      const MemoryStore = (await import("memorystore")).default(session);
      sessionStore = new MemoryStore({
        checkPeriod: 86400000
      });
    }
  } catch (err: any) {
    console.error("[Auth] Session store error:", err);
    const MemoryStore = (await import("memorystore")).default(session);
    sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "fincontrol-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  console.log("[Auth] Passport and session initialized");

  // Local Strategy for email/password authentication
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        console.log(`[Auth Strategy] Verifying user: ${email}`);
        const user = await storage.getUserByEmail(email);
        if (!user || !user.password) {
          console.log(`[Auth Strategy] User not found or no password: ${email}`);
          return done(null, false);
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          console.log(`[Auth Strategy] Invalid password for: ${email}`);
          return done(null, false);
        }

        console.log(`[Auth Strategy] Success for: ${email}`);

        return done(null, {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          team: user.team,
        });
      } catch (error) {
        console.error(`[Auth Strategy] Error:`, error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        team: user.team,
      });
    } catch (err) {
      done(err);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  console.log(`[Auth Debug] Checking requirement for ${req.path}`);
  console.log(`[Auth Debug] IsAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Auth Debug] Session ID: ${req.sessionID}`);
  console.log(`[Auth Debug] User:`, req.user ? { id: req.user.id, username: req.user.username } : "null");

  if (!req.isAuthenticated()) {
    console.log(`[Auth Debug] Rejecting with 401 for ${req.path}`);
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
};

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    console.log(`[Auth Debug] Checking role for ${req.path}, allowed: ${roles}`);
    console.log(`[Auth Debug] User role: ${req.user?.role}`);
    if (!req.isAuthenticated()) {
      console.log(`[Auth Debug] Rejecting with 401 (not auth) for ${req.path}`);
      return res.status(401).json({ error: "Não autenticado" });
    }
    if (!roles.includes(req.user!.role as UserRole)) {
      console.log(`[Auth Debug] Rejecting with 403 (wrong role ${req.user!.role}) for ${req.path}`);
      return res.status(403).json({ error: "Sem permissão para esta ação" });
    }
    next();
  };
};

export const requireAdmin: RequestHandler = requireRole("admin");
export const requireFinancial: RequestHandler = requireRole("admin", "financial");
export const requireViewer: RequestHandler = requireRole("admin", "financial", "viewer");
