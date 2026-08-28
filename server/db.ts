import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "./wheel";
import { randomInt, randomUUID } from "node:crypto";
import { isCrashed, multiplierAt } from "./crash";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getLocalCredentialByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const rows = await db.select({ user: users, credential: localCredentials }).from(localCredentials).innerJoin(users, eq(localCredentials.userId, users.id)).where(eq(localCredentials.username, username)).limit(1);
  return rows[0] ?? null;
}

export async function createLocalUser(input: { username: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async (tx) => {
    const userResult = await tx.insert(users).values({ openId: `local_${randomUUID()}`, name: input.username, loginMethod: "password", lastSignedIn: new Date() });
    const userId = Number(userResult[0]?.insertId);
    if (!userId) throw new Error("USER_CREATE_FAILED");
    await tx.insert(localCredentials).values({ userId, username: input.username, passwordHash: input.passwordHash });
    await tx.insert(wallets).values({ userId, currency: "USDT", availableBalance: "0", lockedBalance: "0" });
    const created = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!created[0]) throw new Error("USER_CREATE_FAILED");
    return created[0];
  });
}

export async function touchLocalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function createPasswordResetToken(userId: number, tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
  return { expiresAt };
}

export async function resetLocalPassword(input: { tokenHash: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, input.tokenHash)).limit(1);
    const token = rows[0];
    if (!token || token.consumedAt || token.expiresAt.getTime() <= Date.now()) throw new Error("INVALID_RESET_TOKEN");
    const credentialRows = await tx.select().from(localCredentials).where(eq(localCredentials.userId, token.userId)).limit(1);
    const credential = credentialRows[0];
    if (!credential) throw new Error("CREDENTIAL_NOT_FOUND");
    const claimed = await tx.update(passwordResetTokens).set({ consumedAt: new Date() }).where(and(eq(passwordResetTokens.id, token.id), isNull(passwordResetTokens.consumedAt)));
    if (!Number(claimed[0]?.affectedRows)) throw new Error("INVALID_RESET_TOKEN");
    await tx.update(localCredentials).set({ passwordHash: input.passwordHash, passwordUpdatedAt: new Date() }).where(eq(localCredentials.id, credential.id));
    const userRows = await tx.select().from(users).where(eq(users.id, token.userId)).limit(1);
    if (!userRows[0]) throw new Error("USER_NOT_FOUND");
    return userRows[0];
  });
}

export type PlaceBetInput = {
  userId: number;
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
    const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, input.userId)).limit(1);
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
      currency: "USDT",
      stake: input.stake.toFixed(6),
      combinedOdds: input.combinedOdds.toFixed(4),
      potentialReturn: input.potentialReturn.toFixed(6),
      selectionsJson: JSON.stringify(input.selections),
      status: "pending",
    });
    await tx.insert(walletTransactions).values({ userId: input.userId, type: "bet_lock", status: "confirmed", currency: "USDT", amount: input.stake.toFixed(6), referenceId: ticketCode });
    await tx.insert(notifications).values({ userId: input.userId, type: "bet", title: "بلیتت ثبت شد", message: `بلیت ${ticketCode} با مبلغ ${input.stake.toFixed(2)} USDT در وضعیت بررسی قرار گرفت.`, href: "/account" });
    return { id: Number(inserted[0].insertId), ticketCode, stake: input.stake, potentialReturn: input.potentialReturn, status: "pending" as const };
  });
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: notifications.id, type: notifications.type, title: notifications.title, message: notifications.message, href: notifications.href, readAt: notifications.readAt, createdAt: notifications.createdAt }).from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(rows[0]?.count ?? 0);
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId), isNull(notifications.readAt)));
  return { success: true as const };
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return { success: true as const };
}

export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt)).limit(20);
  return rows.map((bet) => ({ ...bet, stake: Number(bet.stake), combinedOdds: Number(bet.combinedOdds), potentialReturn: Number(bet.potentialReturn), selections: JSON.parse(bet.selectionsJson) as Array<{ id: string; match: string; market: string; odds: number }> }));
}

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

export async function getWalletTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(50);
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function requestWalletTransaction(input: { userId: number; type: "deposit" | "withdrawal"; amount: number; network?: string; address?: string }) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("INVALID_AMOUNT");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const inserted = await db.insert(walletTransactions).values({ userId: input.userId, type: input.type, status: "pending", amount: input.amount.toFixed(6), network: input.network, address: input.address });
  return { id: Number(inserted[0].insertId), type: input.type, status: "pending" as const, amount: input.amount };
}

export async function getActiveCrashRound(now = new Date()) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crashRounds).where(eq(crashRounds.status, "running")).orderBy(desc(crashRounds.createdAt)).limit(1);
  const round = rows[0];
  if (!round) return null;
  const current = multiplierAt(round.startedAt, now);
  if (current >= Number(round.crashMultiplier)) {
    await db.update(crashRounds).set({ status: "crashed", crashedAt: now }).where(eq(crashRounds.id, round.id));
    await db.update(crashBets).set({ status: "lost", updatedAt: now }).where(and(eq(crashBets.roundId, round.id), eq(crashBets.status, "pending")));
    return { ...round, status: "crashed" as const, currentMultiplier: Number(round.crashMultiplier) };
  }
  return { ...round, currentMultiplier: current };
}

export async function createCrashRound() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const existing = await getActiveCrashRound();
  if (existing?.status === "running") return existing;
  const crashMultiplier = (1.05 + randomInt(0, 1195) / 100).toFixed(2);
  const inserted = await db.insert(crashRounds).values({ roundCode: `CR-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`, crashMultiplier, status: "running" });
  const id = Number(inserted[0].insertId);
  const rows = await db.select().from(crashRounds).where(eq(crashRounds.id, id)).limit(1);
  return rows[0] ? { ...rows[0], currentMultiplier: 1 } : null;
}

export async function getCrashHistory() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(crashRounds).where(eq(crashRounds.status, "crashed")).orderBy(desc(crashRounds.crashedAt)).limit(20);
  return rows.map((round) => ({ id: round.id, roundCode: round.roundCode, multiplier: Number(round.crashMultiplier), crashedAt: round.crashedAt }));
}

export async function placeCrashBet(userId: number, roundId: number, stake: number) {
  if (!Number.isFinite(stake) || stake < 1) throw new Error("INVALID_STAKE");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async (tx) => {
    const rounds = await tx.select().from(crashRounds).where(eq(crashRounds.id, roundId)).limit(1);
    const round = rounds[0];
    if (!round || round.status !== "running" || isCrashed(Number(round.crashMultiplier), round.startedAt)) throw new Error("ROUND_CLOSED");
    const updated = await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} - ${stake}`, lockedBalance: sql`${wallets.lockedBalance} + ${stake}`, updatedAt: new Date() }).where(and(eq(wallets.userId, userId), gte(wallets.availableBalance, stake.toFixed(6))));
    if (!Number(updated[0]?.affectedRows)) throw new Error("INSUFFICIENT_BALANCE");
    const inserted = await tx.insert(crashBets).values({ userId, roundId, stake: stake.toFixed(6), status: "pending" });
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
    await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} + ${payout}`, lockedBalance: sql`${wallets.lockedBalance} - ${row.bet.stake}`, updatedAt: new Date() }).where(eq(wallets.userId, userId));
    await tx.insert(walletTransactions).values({ userId, type: "crash_settlement", status: "confirmed", amount: payout.toFixed(6), referenceId: `crashBet:${crashBetId}` });
    return { id: crashBetId, payout, multiplier: current, status: "won" as const };
  });
}

export async function getActiveGameCatalog() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gameCatalog).where(eq(gameCatalog.status, "active")).orderBy(gameCatalog.title);
}

export async function getOrCreateWalletByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get wallet: database not available");
    return undefined;
  }

  await db.insert(wallets).values({ userId }).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });

  const result = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
