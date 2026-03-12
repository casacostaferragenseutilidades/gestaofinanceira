import { app } from "../server/index";

export default async (req: any, res: any) => {
  try {
    if (!app) {
      return res.status(500).json({ error: "App module failed to load" });
    }
    // Express app is a function (req, res) => void
    return app(req, res);
  } catch (error: any) {
    console.error("[Vercel Fatal] Lambda invocation failed:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      phase: "invocation"
    });
  }
};
