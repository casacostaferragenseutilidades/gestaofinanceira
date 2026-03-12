import express from 'express';

const app = express();

app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: "alive-minimal", 
    time: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

export default app;
