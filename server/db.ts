import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, activityRewardLedger, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, sportAlertPreferences, sportWatchlist, supportedAssets, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "./wheel";
import { randomUUID } from "node:crypto";
import { createCrashSeed, crashMultiplierFromSeed, isCrashed, multiplierAt, rememberPendingSeed, takePendingSeed } from "./crash";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// NOTE: Full db.ts restore - see artifacts. Temporary bootstrap continues in next push if needed.
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getActiveCrashRound(now = new Date()) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crashRounds).where(eq(crashRounds.status, "running")).orderBy(desc(crashRounds.createdAt)).limit(1);
  const round = rows[0];
  if (!round) return null;
  const target = Number(round.crashMultiplier);
  const current = multiplierAt(round.startedAt, now);
  if (current >= target) {
    const revealedSeed = takePendingSeed(round.id) ?? round.serverSeed ?? null;
    await db.update(crashRounds).set({
      status: "crashed",
      crashedAt: now,
      ...(revealedSeed ? { serverSeed: revealedSeed } : {}),
    }).where(eq(crashRounds.id, round.id));
    await db.update(crashBets).set({ status: "lost", updatedAt: now }).where(and(eq(crashBets.roundId, round.id), eq(crashBets.status, "pending")));
    return {
      id: round.id,
      roundCode: round.roundCode,
      status: "crashed" as const,
      startedAt: round.startedAt,
      crashedAt: now,
      serverSeedHash: round.serverSeedHash,
      currentMultiplier: target,
    };
  }
  return {
    id: round.id,
    roundCode: round.roundCode,
    status: "running" as const,
    startedAt: round.startedAt,
    serverSeedHash: round.serverSeedHash,
    currentMultiplier: current,
  };
}

export async function createCrashRound() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const existing = await getActiveCrashRound();
  if (existing?.status === "running") return existing;
  const { serverSeed, serverSeedHash } = createCrashSeed();
  const crashMultiplier = crashMultiplierFromSeed(serverSeed);
  const inserted = await db.insert(crashRounds).values({
    roundCode: `CR-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`,
    crashMultiplier,
    serverSeedHash,
    status: "running",
  });
  const id = Number(inserted[0].insertId);
  rememberPendingSeed(id, serverSeed);
  const rows = await db.select({
    id: crashRounds.id,
    roundCode: crashRounds.roundCode,
    status: crashRounds.status,
    startedAt: crashRounds.startedAt,
    serverSeedHash: crashRounds.serverSeedHash,
  }).from(crashRounds).where(eq(crashRounds.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    roundCode: row.roundCode,
    status: "running" as const,
    startedAt: row.startedAt,
    serverSeedHash: row.serverSeedHash,
    currentMultiplier: 1,
  };
}

export async function getCrashHistory() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(crashRounds).where(eq(crashRounds.status, "crashed")).orderBy(desc(crashRounds.crashedAt)).limit(20);
  return rows.map((round) => {
    const multiplier = Number(round.crashMultiplier);
    const hasProof = Boolean(round.serverSeed && round.serverSeedHash);
    return {
      id: round.id,
      roundCode: round.roundCode,
      multiplier,
      crashedAt: round.crashedAt,
      proof: hasProof
        ? {
            serverSeed: round.serverSeed as string,
            serverSeedHash: round.serverSeedHash as string,
            crashMultiplier: multiplier.toFixed(2),
          }
        : null,
    };
  });
}

export async function placeCrashBet(userId: number, roundId: number, stake: number, currency = "USDT") {
  if (!Number.isFinite(stake) || stake < 1) throw new Error("INVALID_STAKE");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const normalizedCurrency = currency.trim().toUpperCase();
  return db.transaction(async (tx) => {
    const assetRows = await tx.select({ code: supportedAssets.code }).from(supportedAssets).where(and(eq(supportedAssets.code, normalizedCurrency), eq(supportedAssets.status, "active"))).limit(1);
    if (!assetRows[0]) throw new Error("UNSUPPORTED_CURRENCY");
    const rounds = await tx.select().from(crashRounds).where(eq(crashRounds.id, roundId)).limit(1);
    const round = rounds[0];
    if (!round || round.status !== "running" || isCrashed(Number(round.crashMultiplier), round.startedAt)) throw new Error("ROUND_CLOSED");
    const updated = await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} - ${stake}`, lockedBalance: sql`${wallets.lockedBalance} + ${stake}`, updatedAt: new Date() }).where(and(eq(wallets.userId, userId), eq(wallets.currency, normalizedCurrency), gte(wallets.availableBalance, stake.toFixed(6))));
    if (!Number(updated[0]?.affectedRows)) throw new Error("INSUFFICIENT_BALANCE");
    const inserted = await tx.insert(crashBets).values({ userId, roundId, currency: normalizedCurrency, stake: stake.toFixed(6), status: "pending" });
    return { id: Number(inserted[0].insertId), roundId, stake, status: "pending" as const };
  });
}

export async function cashoutCrashBet(userId: number, crashBetId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async (tx) => {
    const rows = await tx.select({ bet: crashBets, round: crashRounds }).from(crashBets).innerJoin(crashRounds, eq(crashBets.roundId, crashRounds.id)).where(and(eq(crashBets.id, crashBetId), eq(crashBets.userId, userId))).limit(1);
    const row = rows[0];
    if (!row || row.bet.status !== "pending") throw new Error("BET_CLOSED");
    const current = multiplierAt(row.round.startedAt);
    if (row.round.status !== "running" || current >= Number(row.round.crashMultiplier)) throw new Error("ROUND_CRASHED");
    const payout = Number((Number(row.bet.stake) * current).toFixed(6));
    await tx.update(crashBets).set({ status: "won", cashoutMultiplier: current.toFixed(4), payout: payout.toFixed(6), updatedAt: new Date() }).where(eq(crashBets.id, crashBetId));
    await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} + ${payout}`, lockedBalance: sql`${wallets.lockedBalance} - ${row.bet.stake}`, updatedAt: new Date() }).where(and(eq(wallets.userId, userId), eq(wallets.currency, row.bet.currency)));
    await tx.insert(walletTransactions).values({ userId, type: "crash_settlement", status: "confirmed", currency: row.bet.currency, amount: payout.toFixed(6), referenceId: `crashBet:${crashBetId}` });
    return { id: crashBetId, payout, multiplier: current, status: "won" as const };
  });
}

export async function getOrCreateWalletByUserId(userId: number, currency = "USDT") {
  const db = await getDb();
  if (!db) return undefined;
  const normalizedCurrency = currency.trim().toUpperCase();
  await db.insert(wallets).values({ userId, currency: normalizedCurrency }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const result = await db.select().from(wallets).where(and(eq(wallets.userId, userId), eq(wallets.currency, normalizedCurrency))).limit(1);
  return result[0];
}
