import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const envVars = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    dbUrlLength: process.env.DATABASE_URL?.length || 0,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
    protocol: req.headers['x-forwarded-proto'],
    host: req.headers.host,
  };

  res.status(200).json({
    status: "Debug point is active",
    environment: envVars,
    headers: req.headers,
  });
}
