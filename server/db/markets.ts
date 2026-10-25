import { inArray } from "drizzle-orm";
import type { MatchCardData } from "../../shared/sports";
import { sportsMarkets } from "../../drizzle/schema";
import { canonicalMarketCode, marketKey, type MarketCode, type MarketSnapshot } from "../markets";
import { isSettleableFixtureId } from "../settlement";
import { getDb } from "./core";

export type SyncSummary = {
  fixtures: number;
  markets: number;
  upserted: number;
  skipped: number;
};

function kickoffOf(match: MatchCardData): Date | null {
  if (!match.startsAt) return null;
  const parsed = new Date(match.startsAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Writes the current price book from a feed snapshot.
 *
 * Only real fixtures with a settleable 1X2 market are stored; preview and demo
 * rows are dropped so they can never be bet on.
 */
export async function syncSportsMarkets(matches: MatchCardData[], now = new Date()): Promise<SyncSummary> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const rows: {
    fixtureId: string;
    code: MarketCode;
    name: string;
    price: string;
    sport: string;
    league: string | null;
    home: string | null;
    away: string | null;
    startsAt: Date | null;
    matchStatus: string | null;
    capturedAt: Date;
  }[] = [];

  const fixtures = new Set<string>();
  let skipped = 0;

  for (const match of matches) {
    if (!match?.id || !isSettleableFixtureId(match.id)) {
      skipped += 1;
      continue;
    }
    const startsAt = kickoffOf(match);
    for (const market of match.markets ?? []) {
      const code = canonicalMarketCode(market.label) ?? canonicalMarketCode(market.name);
      const price = Number(market.odds);
      if (!code || !Number.isFinite(price) || price <= 1) {
        skipped += 1;
        continue;
      }
      rows.push({
        fixtureId: match.id,
        code,
        name: market.name,
        price: price.toFixed(4),
        sport: match.sport || "football",
        league: match.league ?? null,
        home: match.home ?? null,
        away: match.away ?? null,
        startsAt,
        matchStatus: match.status ?? null,
        capturedAt: now,
      });
      fixtures.add(match.id);
    }
  }

  if (!rows.length) return { fixtures: 0, markets: 0, upserted: 0, skipped };

  let upserted = 0;
  for (const row of rows) {
    await db
      .insert(sportsMarkets)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          name: row.name,
          price: row.price,
          sport: row.sport,
          league: row.league,
          home: row.home,
          away: row.away,
          startsAt: row.startsAt,
          matchStatus: row.matchStatus,
          capturedAt: row.capturedAt,
        },
      });
    upserted += 1;
  }

  return { fixtures: fixtures.size, markets: rows.length, upserted, skipped };
}

/** Snapshot lookup keyed as `fixtureId:code`. Missing fixtures are simply absent. */
export async function getMarketSnapshots(fixtureIds: string[]): Promise<Map<string, MarketSnapshot>> {
  const snapshots = new Map<string, MarketSnapshot>();
  const unique = Array.from(new Set(fixtureIds.filter(Boolean)));
  if (!unique.length) return snapshots;

  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const rows = await db.select().from(sportsMarkets).where(inArray(sportsMarkets.fixtureId, unique));
  for (const row of rows) {
    const code = row.code as MarketCode;
    snapshots.set(marketKey(row.fixtureId, code), {
      fixtureId: row.fixtureId,
      code,
      price: Number(row.price),
      capturedAt: row.capturedAt,
      startsAt: row.startsAt ?? null,
      matchStatus: row.matchStatus ?? null,
    });
  }
  return snapshots;
}

/** Markets for one fixture, for the UI to show the price the server would accept. */
export async function getFixtureMarkets(fixtureId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(sportsMarkets).where(inArray(sportsMarkets.fixtureId, [fixtureId]));
  return rows.map((row) => ({ code: row.code, name: row.name, price: Number(row.price), capturedAt: row.capturedAt }));
}
