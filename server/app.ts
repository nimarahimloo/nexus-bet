import express, { type Express, type Request } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerNowPaymentsWebhook } from "./nowpaymentsWebhook";
import { registerMarketSyncRoutes } from "./marketSyncWorker";
import { registerSettlementRoutes } from "./settlementWorker";
import { registerSportAlertRoutes } from "./sportAlerts";
import { ENV } from "./_core/env";
import { allowedHostsFromPublicUrl, originGuard } from "./_core/originGuard";
import { nowPaymentsReadiness } from "./nowpayments";
import { getDb } from "./db";
import { securityHeaders } from "./_core/securityHeaders";
import { buildHealthPayload, probeDatabase } from "./health";

/** Shared Express app (local server + Vercel serverless). Does not call listen(). */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders());

  app.use(
    express.json({
      // 50 MB was an invitation: nothing this API accepts is larger than a few
      // kilobytes, and the IPN body is signed and re-verified from raw bytes.
      limit: "2mb",
      verify: (req, _res, buffer) => {
        (req as unknown as Request & { rawBody?: string }).rawBody = buffer.toString("utf8");
      },
    }),
  );

  // CSRF layer two: cross-origin state-changing requests are rejected before
  // any route sees them. SameSite=Lax on the session cookie is layer one.
  app.use("/api", originGuard(allowedHostsFromPublicUrl(ENV.appPublicUrl)));

  registerOAuthRoutes(app);
  registerNowPaymentsWebhook(app);
  registerSportAlertRoutes(app);
  registerSettlementRoutes(app);
  registerMarketSyncRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  app.get("/api/health", async (_req, res) => {
    const dbOk = await probeDatabase();
    const payload = buildHealthPayload({
      dbOk,
      sportsConfigured: Boolean(ENV.sportsApiKey?.trim()),
      uptimeSeconds: process.uptime(),
    });
    res.status(dbOk ? 200 : 503).json(payload);
  });

  return app;
}
