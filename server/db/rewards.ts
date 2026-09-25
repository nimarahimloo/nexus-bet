import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { InsertUser, activityRewardLedger, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, sportAlertPreferences, sportWatchlist, supportedAssets, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "../wheel";
import { randomUUID } from "node:crypto";
import { createCrashSeed, crashMultiplierFromSeed, isCrashed, multiplierAt, rememberPendingSeed, takePendingSeed } from "../crash";
import { ENV } from '../_core/env';
import { getDb } from "./core";

export async function spinLuckyWheel(userId: number, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const spinDate = getUtcDateKey(now);

  return db.transaction(async (tx) => {
    const reward = selectWheelReward();
    const insertedSpin = await tx.insert(wheelSpins).values({
      userId,
      spinDate,
      rewardCode: reward.code,
      rewardLabel: reward.label,
      rewardType: reward.type,
      rewardAmount: reward.amount.toFixed(6),
    });
    const spinId = Number(insertedSpin[0].insertId);

    if (reward.type === "usdt" && reward.amount > 0) {
      await tx.insert(wallets).values({ userId }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
      await tx.update(wallets).set({
        availableBalance: sql`${wallets.availableBalance} + ${reward.amount}`,
        updatedAt: new Date(),
      }).where(eq(wallets.userId, userId));
      await tx.insert(rewardLedger).values({
        userId,
        spinId,
        currency: "USDT",
        amount: reward.amount.toFixed(6),
        entryType: "wheel_reward",
      });
      await tx.insert(walletTransactions).values({ userId, type: "wheel_reward", status: "confirmed", currency: "USDT", amount: reward.amount.toFixed(6), referenceId: `wheelSpin:${spinId}` });
    }

    return { spinId, spinDate, reward: { code: reward.code, label: reward.label, type: reward.type, amount: reward.amount } };
  });
}

export async function getWheelHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(wheelSpins).where(eq(wheelSpins.userId, userId)).orderBy(desc(wheelSpins.createdAt)).limit(20);
  return rows.map((spin) => ({ ...spin, rewardAmount: Number(spin.rewardAmount) }));
}

export async function getWheelStatus(userId: number, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const spinDate = getUtcDateKey(now);
  const rows = await db.select({ id: wheelSpins.id, createdAt: wheelSpins.createdAt }).from(wheelSpins).where(and(eq(wheelSpins.userId, userId), eq(wheelSpins.spinDate, spinDate))).limit(1);
  return { canSpin: rows.length === 0, spinDate, lastSpinAt: rows[0]?.createdAt ?? null };
}

export async function getActivePromotions(now = new Date()) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promotions).where(and(eq(promotions.status, "active"), lte(promotions.startsAt, now), gte(promotions.endsAt, now))).orderBy(desc(promotions.endsAt));
}

export async function claimPromotion(userId: number, promotionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const promotion = await db.select().from(promotions).where(and(eq(promotions.id, promotionId), eq(promotions.status, "active"))).limit(1);
  if (!promotion[0]) throw new Error("PROMOTION_UNAVAILABLE");
  const inserted = await db.insert(promotionClaims).values({ promotionId, userId });
  return { id: Number(inserted[0].insertId), promotionId, status: "claimed" as const };
}

export async function getTournaments(status?: "upcoming" | "live" | "ended") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tournaments).where(status ? eq(tournaments.status, status) : undefined).orderBy(desc(tournaments.startsAt));
}

export async function getTournamentLeaderboard(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ entry: tournamentEntries, userName: users.name }).from(tournamentEntries).leftJoin(users, eq(tournamentEntries.userId, users.id)).where(eq(tournamentEntries.tournamentId, tournamentId)).orderBy(desc(tournamentEntries.points)).limit(100);
  return rows.map(({ entry, userName }) => ({ ...entry, points: Number(entry.points), userName: userName ?? "کاربر Nexus" }));
}

export async function getVipSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const [total] = await db.select({ points: sum(vipActivity.points) }).from(vipActivity).where(eq(vipActivity.userId, userId));
  const points = Number(total?.points ?? 0);
  const tiers = [{ name: "Core", min: 0 }, { name: "Plus", min: 100 }, { name: "Prime", min: 500 }, { name: "Nexus", min: 1500 }];
  const current = [...tiers].reverse().find((tier) => points >= tier.min) ?? tiers[0];
  const next = tiers[tiers.findIndex((tier) => tier.name === current.name) + 1] ?? null;
  return { points, currentTier: current.name, nextTier: next?.name ?? null, nextThreshold: next?.min ?? null, progress: next ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100)) : 100 };
}

const ACTIVITY_REWARDS = [{ code: "daily_checkin", label: "حضور روزانه", amount: 0.05, description: "ورود و بررسی وضعیت حساب؛ بدون نیاز به ثبت شرط" }] as const;

export async function getActivityRewardStatus(userId: number, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const activityDate = getUtcDateKey(now);
  const rows = await db.select().from(activityRewardLedger).where(and(eq(activityRewardLedger.userId, userId), eq(activityRewardLedger.activityDate, activityDate))).orderBy(desc(activityRewardLedger.createdAt));
  return { activityDate, tasks: ACTIVITY_REWARDS.map((task) => ({ ...task, claimed: rows.some((row) => row.activityCode === task.code) })), history: rows.slice(0, 20).map((row) => ({ ...row, amount: Number(row.amount) })) };
}

export async function claimActivityReward(userId: number, activityCode: string, now = new Date()) {
  const task = ACTIVITY_REWARDS.find((item) => item.code === activityCode);
  if (!task) throw new Error("UNKNOWN_ACTIVITY");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const activityDate = getUtcDateKey(now);
  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: activityRewardLedger.id }).from(activityRewardLedger).where(and(eq(activityRewardLedger.userId, userId), eq(activityRewardLedger.activityCode, activityCode), eq(activityRewardLedger.activityDate, activityDate))).limit(1);
    if (existing.length) throw new Error("ACTIVITY_ALREADY_CLAIMED");
    const inserted = await tx.insert(activityRewardLedger).values({ userId, activityCode, activityDate, currency: "USDT", amount: task.amount.toFixed(6) });
    await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} + ${task.amount}`, updatedAt: now }).where(eq(wallets.userId, userId));
    await tx.insert(walletTransactions).values({ userId, type: "activity_reward", status: "confirmed", currency: "USDT", amount: task.amount.toFixed(6), referenceId: `activity:${activityCode}:${activityDate}` });
    return { id: Number(inserted[0].insertId), activityCode, activityDate, reward: { label: task.label, amount: task.amount, currency: "USDT" as const } };
  });
}
