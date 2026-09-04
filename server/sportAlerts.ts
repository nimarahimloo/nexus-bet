import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { dispatchDueSportAlerts } from "./db";

export async function processSportAlerts(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await dispatchDueSportAlerts();
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}

export function registerSportAlertRoutes(app: Express) {
  app.post("/api/scheduled/processSportAlerts", processSportAlerts);
}
