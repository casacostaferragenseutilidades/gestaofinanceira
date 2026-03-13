import { app } from "../server/index.js";

export default async (req: any, res: any) => {
  try {
    if (!app) {
      return res.status(500).json({ error: "App failed to load from server/index" });
    }
    return app(req, res);
  } catch (error: any) {
    console.error("[Vercel Fatal] Lambda invocation failed:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};
