// Handler para Vercel com servidor completo
module.exports = async function handler(req, res) {
    console.log('[Vercel Handler] Request:', req.method, req.url);
    
    try {
        // Import dinâmico do servidor - caminho correto para o build
        const { app } = await import("./dist/index.cjs");
        console.log('[Vercel Handler] Server imported successfully');
        
        // Verificar se DATABASE_URL está disponível
        if (!process.env.DATABASE_URL) {
            console.error('[Vercel Handler] DATABASE_URL not found in environment');
            return res.status(500).json({
                error: 'Configuration Error',
                details: 'DATABASE_URL environment variable is missing'
            });
        }
        
        console.log('[Vercel Handler] DATABASE_URL found, proceeding...');
        return app(req, res);
        
    } catch (error) {
        console.error('[Vercel Handler] Error:', error);
        res.status(500).json({
            error: 'Server Initialization Failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
