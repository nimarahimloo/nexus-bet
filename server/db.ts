import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, bets, rewardLedger, users, wallets, wheelSpins } from "../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "./wheel";
import { randomUUID } from "node:crypto";
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
    return { id: Number(inserted[0].insertId), ticketCode, stake: input.stake, potentialReturn: input.potentialReturn, status: "pending" as const };
  });
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
