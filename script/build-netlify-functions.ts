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
import { app } from '../../server/index';
import serverless from 'serverless-http';

// Initialize the database connection for serverless
export const handler = serverless(app);
`;

// Write the files
fs.writeFileSync(path.join(functionsDir, 'api.ts'), apiFunction);


console.log('Netlify functions built successfully!');
