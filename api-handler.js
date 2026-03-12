// Handler ultra-simples para teste
exports.handler = async function(req, res) {
    console.log('Request received:', req.method, req.url);
    
    // Resposta simples para qualquer requisição
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        message: 'Handler working',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
};
