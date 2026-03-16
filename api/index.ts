import type { IncomingMessage, ServerResponse } from "http";

/**
 * Vercel Serverless Function Entry Point
 * 
 * Estratégia: Lazy initialization do handler serverless.
 * O app Express é criado apenas na primeira requisição para evitar
 * problemas de timeout na inicialização do módulo.
 */

let handlerPromise: Promise<(req: IncomingMessage, res: ServerResponse) => void> | null = null;

async function getHandler() {
  if (handlerPromise) return handlerPromise;

  handlerPromise = (async () => {
    try {
      console.log("[Vercel Init] Loading server module...");
      
      // Importar o app de forma lazy para evitar crashes no carregamento do módulo
      const { app } = await import("../server/index");
      
      if (!app) {
        throw new Error("Express app is undefined after import");
      }

      // Importar serverless-http de forma lazy também
      const serverlessModule = await import("serverless-http");
      const serverless = serverlessModule.default;

      const handler = serverless(app, {
        binary: ["image/*", "font/*", "application/pdf"],
      });

      console.log("[Vercel Init] Handler created successfully");
      return handler as any;
    } catch (error: any) {
      console.error("[Vercel Init] FATAL - Failed to create handler:", error.message);
      console.error("[Vercel Init] Stack:", error.stack);
      // Reset para tentar novamente na próxima requisição
      handlerPromise = null;
      throw error;
    }
  })();

  return handlerPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const serverHandler = await getHandler();
    return await serverHandler(req, res);
  } catch (error: any) {
    console.error("[Vercel Handler] Unhandled error:", error.message);
    
    // Resposta de erro detalhada para debug
    (res as any).status
      ? (res as any).status(500).json({
          error: "Server Initialization Failed",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      : (() => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Server Initialization Failed",
              message: error.message,
              timestamp: new Date().toISOString(),
            })
          );
        })();
  }
}
