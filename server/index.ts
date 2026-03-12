import express from 'express';

export const app = express();

app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: "alive-from-server-index", 
    time: new Date().toISOString()
  });
});

export const httpServer = null;
