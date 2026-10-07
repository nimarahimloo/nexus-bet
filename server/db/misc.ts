import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { InsertUser, activityRewardLedger, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, sportAlertPreferences, sportWatchlist, supportedAssets, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "../wheel";
import { randomUUID } from "node:crypto";
import { createCrashSeed, crashMultiplierFromSeed, isCrashed, multiplierAt, rememberPendingSeed, takePendingSeed } from "../crash";
import { ENV } from '../_core/env';
import { getDb } from "./core";
import { getWalletPortfolio } from "./wallet";
import { getUserBets } from "./bets";

export type GameCatalogFilters = {
  vertical?: string;
  category?: string;
  provider?: string;
  mode?: "demo" | "real";
  featured?: boolean;
  newest?: boolean;
  limit?: number;
};

export async function getActiveGameCatalog(filters: GameCatalogFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(gameCatalog.status, "active")];
  if (filters.vertical) conditions.push(eq(gameCatalog.vertical, filters.vertical));
  if (filters.category) conditions.push(eq(gameCatalog.category, filters.category));
  if (filters.provider) conditions.push(eq(gameCatalog.provider, filters.provider));
  if (filters.mode) conditions.push(eq(gameCatalog.mode, filters.mode));
  if (filters.featured) conditions.push(eq(gameCatalog.isFeatured, 1));
  const ordering = filters.newest ? [desc(gameCatalog.updatedAt), gameCatalog.title] : filters.featured ? [desc(gameCatalog.isFeatured), gameCatalog.title] : [gameCatalog.title];
  return db.select().from(gameCatalog).where(and(...conditions)).orderBy(...ordering).limit(filters.limit ?? 100);
}

export async function getSupportAccountContext(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const portfolio = await getWalletPortfolio(userId);
  const bets = await getUserBets(userId);
  return {
    wallet: portfolio.map((asset) => ({ currency: asset.code, availableBalance: asset.availableBalance, lockedBalance: asset.lockedBalance })),
    bets: bets.slice(0, 8).map((bet) => ({ ticketCode: bet.ticketCode, currency: bet.currency, status: bet.status, stake: bet.stake, combinedOdds: bet.combinedOdds, potentialReturn: bet.potentialReturn, createdAt: bet.createdAt, selections: bet.selections.map((selection) => ({ match: selection.match, market: selection.market, odds: selection.odds })) })),
  };
}
