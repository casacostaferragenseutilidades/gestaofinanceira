import { app } from "../server/index";

export default async (req: any, res: any) => {
  try {
    // Vercel expects the app to handle the req/res.
    // Since app is an Express instance, it's also a valid request handler.
    return app(req, res);
  } catch (error: any) {
    console.error("[Vercel Fatal] Lambda invocation failed:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
