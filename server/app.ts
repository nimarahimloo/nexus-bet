import express, { type Express, type Request } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
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
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", async (_req, res) => {
    let database: "ok" | "unavailable" = "unavailable";
    try {
      const db = await getDb();
      if (db) database = "ok";
    } catch {
      database = "unavailable";
    }
    const payments = nowPaymentsReadiness({
      apiKey: ENV.nowPaymentsApiKey,
      ipnSecret: ENV.nowPaymentsIpnSecret,
      payoutWallet: ENV.nowPaymentsPayoutWallet,
      payoutAuthToken: ENV.nowPaymentsPayoutAuthToken,
    });
    const body = {
      ok: database === "ok",
      database,
      payments: {
        enabled: payments.enabled,
        payoutEnabled: payments.payoutEnabled,
        reason: payments.reason,
      },
      sports: { configured: Boolean(ENV.sportsApiKey.trim()) },
      env: ENV.isProduction ? "production" : "development",
    };
    res.status(database === "ok" ? 200 : 503).json(body);
  });

  registerStorageProxy(app);
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

  return app;
}
