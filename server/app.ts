import express, { type Express, type Request } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerNowPaymentsWebhook } from "./nowpaymentsWebhook";
import { registerSportAlertRoutes } from "./sportAlerts";
import { ENV } from "./_core/env";
import { nowPaymentsReadiness } from "./nowpayments";
import { getDb } from "./db";

/** Shared Express app (local server + Vercel serverless). Does not call listen(). */
export function createApp(): Express {
  const app = express();

  app.use(
    express.json({
      limit: "50mb",
      verify: (req, _res, buffer) => {
        (req as unknown as Request & { rawBody?: string }).rawBody = buffer.toString("utf8");
      },
    }),
  );

  registerOAuthRoutes(app);
  registerNowPaymentsWebhook(app);
  registerSportAlertRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  app.get("/api/health", async (_req, res) => {
    const db = await getDb();
    res.json({
      ok: true,
      database: Boolean(db),
      payments: nowPaymentsReadiness(),
      env: {
        hasDatabaseUrl: Boolean(ENV.databaseUrl?.trim()),
      },
    });
  });

  return app;
}
