import express from 'express';

export const app = express();

app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: "alive-from-api-app", 
    time: new Date().toISOString()
  });
});
