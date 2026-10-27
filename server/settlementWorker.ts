/**
 * Cron entry point for sports bet settlement.
 *
 * Intended schedule: every 5 minutes, UTC (see docs/settlement.md).
 * Auth is the same cron-only contract as `/api/scheduled/processSportAlerts`:
 * the platform heartbeat authenticates with a `cron_*` user and a task uid.
 *
 * Manual trigger (cron credentials required):
 *   POST /api/scheduled/settleSportsBets?dryRun=1&limit=200
 * `dryRun=1` reports what would settle without moving a single unit.
 */

import type { Express, Request, Response } from "express";
import { HttpError } from "@shared/_core/errors";
import { sdk } from "./_core/sdk";
import { settlePendingSportsBets } from "./db";

export async function runSportsSettlement(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid)
      return res.status(403).json({ error: "cron-only" });

    const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";
    const requestedLimit = Number(req.query.limit);
    const summary = await settlePendingSportsBets({
      dryRun,
      limit: Number.isFinite(requestedLimit) ? requestedLimit : undefined,
    });

    return res.json({ ok: true, taskUid: user.taskUid, ...summary });
  } catch (error) {
    // Auth failures are a caller problem, not a worker problem.
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: "CRON_AUTH_REQUIRED" });
    }
    const message = error instanceof Error ? error.message : String(error);
    // Never echo request URLs or provider payloads back to the caller.
    console.warn("[Settlement] run failed:", message);
    return res.status(500).json({ error: "SETTLEMENT_FAILED", message });
  }
}

export function registerSettlementRoutes(app: Express) {
  app.post("/api/scheduled/settleSportsBets", runSportsSettlement);
}
