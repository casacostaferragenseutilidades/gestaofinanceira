import serverless from "serverless-http";
import { app } from "../server/index";

// Log para debug no painel do Vercel
console.log("[Vercel API] Entry point loaded");

const handler = serverless(app);

export default async (req: any, res: any) => {
    try {
        console.log(`[Vercel API] Request: ${req.method} ${req.url}`);
        return await handler(req, res);
    } catch (error: any) {
        console.error("[Vercel API] Runtime Error:", error);
        res.status(500).json({
            error: "Erro de execução na função serverless",
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
};
