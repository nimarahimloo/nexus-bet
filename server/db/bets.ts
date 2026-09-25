import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { InsertUser, activityRewardLedger, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, sportAlertPreferences, sportWatchlist, supportedAssets, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "../wheel";
import { randomUUID } from "node:crypto";
import { createCrashSeed, crashMultiplierFromSeed, isCrashed, multiplierAt, rememberPendingSeed, takePendingSeed } from "../crash";
import { ENV } from '../_core/env';
import { getDb } from "./core";

export type PlaceBetInput = {
  userId: number;
  currency?: string;
  stake: number;
  combinedOdds: number;
  potentialReturn: number;
  selections: Array<{ id: string; match: string; market: string; odds: number }>;
};

export async function placeBet(input: PlaceBetInput) {
  if (!Number.isFinite(input.stake) || input.stake < 1) throw new Error("INVALID_STAKE");
  if (!Number.isFinite(input.combinedOdds) || input.combinedOdds <= 0) throw new Error("INVALID_ODDS");
  if (!input.selections.length) throw new Error("EMPTY_SELECTIONS");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  return db.transaction(async (tx) => {
    const currency = input.currency?.trim().toUpperCase() || "USDT";
    const assetRows = await tx.select({ code: supportedAssets.code }).from(supportedAssets).where(and(eq(supportedAssets.code, currency), eq(supportedAssets.status, "active"))).limit(1);
    if (!assetRows[0]) throw new Error("UNSUPPORTED_CURRENCY");
    const walletRows = await tx.select().from(wallets).where(and(eq(wallets.userId, input.userId), eq(wallets.currency, currency))).limit(1);
    const wallet = walletRows[0];
    if (!wallet || Number(wallet.availableBalance) < input.stake) throw new Error("INSUFFICIENT_BALANCE");

    const updated = await tx.update(wallets).set({
      availableBalance: sql`${wallets.availableBalance} - ${input.stake}`,
      lockedBalance: sql`${wallets.lockedBalance} + ${input.stake}`,
      updatedAt: new Date(),
    }).where(and(eq(wallets.userId, input.userId), gte(wallets.availableBalance, input.stake.toFixed(6))));
    if (!Number(updated[0]?.affectedRows)) throw new Error("INSUFFICIENT_BALANCE");

    const ticketCode = `NX-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const inserted = await tx.insert(bets).values({
      userId: input.userId,
      ticketCode,
      currency,
      stake: input.stake.toFixed(6),
      combinedOdds: input.combinedOdds.toFixed(4),
      potentialReturn: input.potentialReturn.toFixed(6),
      selectionsJson: JSON.stringify(input.selections),
      status: "pending",
    });
    await tx.insert(walletTransactions).values({ userId: input.userId, type: "bet_lock", status: "confirmed", currency, amount: input.stake.toFixed(6), referenceId: ticketCode });
    await tx.insert(notifications).values({ userId: input.userId, type: "bet", title: "بلیتت ثبت شد", message: `بلیت ${ticketCode} با مبلغ ${input.stake.toFixed(2)} ${currency} در وضعیت بررسی قرار گرفت.`, href: "/account" });
    return { id: Number(inserted[0].insertId), ticketCode, stake: input.stake, potentialReturn: input.potentialReturn, status: "pending" as const };
  });
}

export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt)).limit(20);
  return rows.map((bet) => ({ ...bet, stake: Number(bet.stake), combinedOdds: Number(bet.combinedOdds), potentialReturn: Number(bet.potentialReturn), selections: JSON.parse(bet.selectionsJson) as Array<{ id: string; match: string; market: string; odds: number }> }));
}
