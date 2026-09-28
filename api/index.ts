import { createApp } from "../server/app";

/** Vercel serverless entry — Express app handles /api/* */
const app = createApp();

export default app;
