
import { app } from '../../server/index';
import serverless from 'serverless-http';

// Initialize the database connection for serverless
export const handler = serverless(app);
