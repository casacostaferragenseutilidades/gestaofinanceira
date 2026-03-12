import serverless from "serverless-http";
import { app } from "../server/index";

// Export the app wrapped with serverless-http for better compatibility with Vercel
export default serverless(app);
