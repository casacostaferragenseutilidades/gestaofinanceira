/**
 * Vercel Serverless Function Entry Point
 * 
 * Estratégia: Lazy initialization com timeout otimizado.
 * O app Express é criado apenas na primeira requisição para evitar
 * problemas de timeout na inicialização do módulo.
 */

let handlerPromise = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

async function getHandler() {
  if (handlerPromise) return handlerPromise;
  
  if (initAttempts >= MAX_INIT_ATTEMPTS) {
    throw new Error(`Handler initialization failed after ${MAX_INIT_ATTEMPTS} attempts`);
  }

  initAttempts++;
  console.log(`[Vercel Init] Attempt ${initAttempts}/${MAX_INIT_ATTEMPTS}`);

  handlerPromise = (async () => {
    try {
      console.log("[Vercel Init] Loading server module...");
      
      // Verificar DATABASE_URL primeiro
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is missing");
      }
      
      console.log("[Vercel Init] DATABASE_URL found, checking format...");
      const dbUrl = process.env.DATABASE_URL;
      console.log(`[Vercel Init] DB URL starts with: ${dbUrl.substring(0, 20)}...`);
      console.log(`[Vercel Init] DB URL length: ${dbUrl.length}`);
      
      console.log("[Vercel Init] Proceeding with import...");
      
      // Timeout para importação - evitar hangs
      const importPromise = import("../dist/index.cjs");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Import timeout after 20 seconds")), 20000)
      );
      
      const moduleResult = await Promise.race([importPromise, timeoutPromise]);
      const { app } = moduleResult;
      
      if (!app) {
        throw new Error("Express app is undefined after import");
      }

      console.log("[Vercel Init] Server module loaded, creating serverless handler...");

      // Importar serverless-http de forma lazy também
      const serverlessModule = await import("serverless-http");
      const serverless = serverlessModule.default;

      const handler = serverless(app, {
        binary: ["image/*", "font/*", "application/pdf"],
      });

      console.log("[Vercel Init] Handler created successfully");
      return handler;
    } catch (error) {
      console.error("[Vercel Init] FATAL - Failed to create handler:", error.message);
      console.error("[Vercel Init] Stack:", error.stack);
      // Reset para tentar novamente na próxima requisição
      handlerPromise = null;
      throw error;
    }
  })();

  return handlerPromise;
}

module.exports = async function handler(req, res) {
  try {
    console.log(`[Vercel Handler] ${req.method} ${req.url}`);
    
    // Log das variáveis de ambiente (sem expor valores sensíveis)
    console.log("[Vercel Handler] Environment check:");
    console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`  - VERCEL: ${process.env.VERCEL || 'undefined'}`);
    console.log(`  - VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`);
    
    const serverHandler = await getHandler();
    return await serverHandler(req, res);
  } catch (error) {
    console.error("[Vercel Handler] Unhandled error:", error.message);
    
    // Resposta de erro detalhada para debug
    if (res.status) {
      res.status(500).json({
        error: "Server Initialization Failed",
        message: error.message,
        timestamp: new Date().toISOString(),
        env_check: {
          DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
          NODE_ENV: process.env.NODE_ENV || 'undefined',
          VERCEL: process.env.VERCEL || 'undefined',
          VERCEL_ENV: process.env.VERCEL_ENV || 'undefined'
        },
        init_attempts: initAttempts,
        max_attempts: MAX_INIT_ATTEMPTS
      });
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Server Initialization Failed",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }
};
