import "dotenv/config";
import express, { type Request } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerNowPaymentsWebhook } from "../nowpaymentsWebhook";
import { registerSportAlertRoutes } from "../sportAlerts";
import { serveStatic, setupVite } from "./vite";
import { ENV, assertProductionEnv } from "./env";
import { nowPaymentsReadiness } from "../nowpayments";
import { getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  assertProductionEnv();

  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb", verify: (req, _res, buffer) => { (req as unknown as Request & { rawBody?: string }).rawBody = buffer.toString("utf8"); } }));
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
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
