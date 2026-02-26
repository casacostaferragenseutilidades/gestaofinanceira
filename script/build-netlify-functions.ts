import fs from 'fs';
import path from 'path';

const netlifyDir = path.resolve(process.cwd(), 'netlify');
const functionsDir = path.join(netlifyDir, 'functions');

// Create directories if they don't exist
if (!fs.existsSync(netlifyDir)) {
  fs.mkdirSync(netlifyDir, { recursive: true });
}

if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Create a main API function that handles all routes
const apiFunction = `
import { handler } from './api-handler.js';

export { handler };
`;

const apiHandler = `
import express from 'express';
import serverless from 'serverless-http';

// Mock user data for testing
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Administrador' },
  { id: 2, username: 'user', password: 'user123', name: 'Usuário Teste' }
];

// Simplified handler for Netlify
const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Credenciais inválidas',
      message: 'Usuário e senha são obrigatórios'
    });
  }

  // Check mock users
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Mock session/token
    const token = Buffer.from(\`\${user.id}:\${Date.now()}\`).toString('base64');
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      },
      token
    });
  } else {
    res.status(401).json({ 
      error: 'Credenciais inválidas',
      message: 'Usuário ou senha incorretos'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  // Mock authenticated user check
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Não autorizado',
      message: 'Token de autenticação não fornecido'
    });
  }

  // Mock user data (in real app, validate token)
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'admin',
      name: 'Administrador'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ 
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Catch-all handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    message: 'The requested API endpoint is not available',
    path: req.path
  });
});

// Main handler
export const handler = serverless(app);
`;

// Write the files
fs.writeFileSync(path.join(functionsDir, 'api.js'), apiFunction);
fs.writeFileSync(path.join(functionsDir, 'api-handler.js'), apiHandler);

// Create a package.json for functions
const functionsPackageJson = {
  "type": "module",
  "dependencies": {
    "express": "^4.21.2",
    "serverless-http": "^3.2.0"
  }
};

fs.writeFileSync(
  path.join(functionsDir, 'package.json'),
  JSON.stringify(functionsPackageJson, null, 2)
);

console.log('Netlify functions built successfully!');
