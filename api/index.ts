import express from 'express';

const app = express();

app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: "alive-express-minimal", 
    time: new Date().toISOString()
  });
});

export default app;
