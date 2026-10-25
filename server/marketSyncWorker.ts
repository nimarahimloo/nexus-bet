/**
 * Cron entry point that refreshes the server-side price book.
 *
 * Bets are priced only from `sportsMarkets`, so this job is what keeps that
 * table warm. Without it, `bet.place` fails closed with MARKET_UNAVAILABLE —
 * which is the intended behaviour, not an outage to route around.
 *
 *   POST /api/scheduled/syncSportsMarkets
 */

import type { Express, Request, Response } from "express";
import { HttpError } from "@shared/_core/errors";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { syncSportsMarkets } from "./db";
import { fetchSportsUniverse } from "./multiSportsFeed";

export async function runMarketSync(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

    if (!ENV.sportsApiKey.trim()) {
      return res.status(503).json({ ok: false, error: "SPORTS_API_KEY_MISSING" });
    }

    const feed = await fetchSportsUniverse(ENV.sportsApiKey, 30, false);
    const summary = await syncSportsMarkets(feed.matches);
    return res.json({
      ok: true,
      taskUid: user.taskUid,
      feedSource: feed.source,
      feedError: feed.error,
      ...summary,
    });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.statusCode).json({ error: "CRON_AUTH_REQUIRED" });
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[MarketSync] run failed:", message);
    return res.status(500).json({ error: "MARKET_SYNC_FAILED", message });
  }
}

export function registerMarketSyncRoutes(app: Express) {
  app.post("/api/scheduled/syncSportsMarkets", runMarketSync);
}
