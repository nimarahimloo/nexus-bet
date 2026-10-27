import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import {
  InsertUser,
  activityRewardLedger,
  bets,
  crashBets,
  crashRounds,
  gameCatalog,
  localCredentials,
  notifications,
  passwordResetTokens,
  promotionClaims,
  promotions,
  rewardLedger,
  sportAlertPreferences,
  sportWatchlist,
  supportedAssets,
  tournamentEntries,
  tournaments,
  users,
  vipActivity,
  walletTransactions,
  wallets,
  wheelSpins,
} from "../../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "../wheel";
import { randomUUID } from "node:crypto";
import {
  createCrashSeed,
  crashMultiplierFromSeed,
  isCrashed,
  multiplierAt,
  rememberPendingSeed,
  takePendingSeed,
} from "../crash";
import { ENV } from "../_core/env";
import { getDb } from "./core";

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
      values.role = "admin";
      updateSet.role = "admin";
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getLocalCredentialByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const rows = await db
    .select({ user: users, credential: localCredentials })
    .from(localCredentials)
    .innerJoin(users, eq(localCredentials.userId, users.id))
    .where(eq(localCredentials.username, username))
    .limit(1);
  return rows[0] ?? null;
}

export async function createLocalUser(input: {
  username: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async tx => {
    const userResult = await tx.insert(users).values({
      openId: `local_${randomUUID()}`,
      name: input.username,
      loginMethod: "password",
      lastSignedIn: new Date(),
    });
    const userId = Number(userResult[0]?.insertId);
    if (!userId) throw new Error("USER_CREATE_FAILED");
    await tx.insert(localCredentials).values({
      userId,
      username: input.username,
      passwordHash: input.passwordHash,
    });
    await tx.insert(wallets).values({
      userId,
      currency: "USDT",
      availableBalance: "0",
      lockedBalance: "0",
    });
    const created = await tx
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!created[0]) throw new Error("USER_CREATE_FAILED");
    return created[0];
  });
}

export async function touchLocalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
export const MAX_RESET_ATTEMPTS = 5;

export async function createPasswordResetToken(
  userId: number,
  tokenHash: string
) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return db.transaction(async tx => {
    // One live code per account: issuing a new one retires the previous codes,
    // so a leaked code stops working the moment the user asks again.
    await tx
      .update(passwordResetTokens)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.consumedAt)
        )
      );
    await tx
      .insert(passwordResetTokens)
      .values({ userId, tokenHash, expiresAt });
    return { expiresAt };
  });
}

/**
 * Redeems a reset code for a specific account.
 *
 * The code alone is not enough: the caller must name the username, the token
 * must belong to that account, and each wrong guess burns one of
 * MAX_RESET_ATTEMPTS on the token — so guessing cannot be spread across IPs.
 */
export async function resetLocalPassword(input: {
  username: string;
  tokenHash: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async tx => {
    const credentialRows = await tx
      .select()
      .from(localCredentials)
      .where(eq(localCredentials.username, input.username))
      .limit(1);
    const credential = credentialRows[0];
    if (!credential) throw new Error("INVALID_RESET_TOKEN");

    const rows = await tx
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, credential.userId),
          isNull(passwordResetTokens.consumedAt)
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);
    const token = rows[0];
    if (!token) throw new Error("INVALID_RESET_TOKEN");
    if (token.expiresAt.getTime() <= Date.now())
      throw new Error("INVALID_RESET_TOKEN");
    if (token.attempts >= MAX_RESET_ATTEMPTS)
      throw new Error("RESET_TOKEN_LOCKED");

    if (token.tokenHash !== input.tokenHash) {
      const next = token.attempts + 1;
      const exhausted = next >= MAX_RESET_ATTEMPTS;
      await tx
        .update(passwordResetTokens)
        .set({
          attempts: next,
          ...(exhausted ? { consumedAt: new Date() } : {}),
        })
        .where(eq(passwordResetTokens.id, token.id));
      throw new Error(exhausted ? "RESET_TOKEN_LOCKED" : "INVALID_RESET_TOKEN");
    }

    const claimed = await tx
      .update(passwordResetTokens)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.id, token.id),
          isNull(passwordResetTokens.consumedAt)
        )
      );
    if (!Number(claimed[0]?.affectedRows))
      throw new Error("INVALID_RESET_TOKEN");

    await tx
      .update(localCredentials)
      .set({ passwordHash: input.passwordHash, passwordUpdatedAt: new Date() })
      .where(eq(localCredentials.id, credential.id));
    const userRows = await tx
      .select()
      .from(users)
      .where(eq(users.id, credential.userId))
      .limit(1);
    if (!userRows[0]) throw new Error("USER_NOT_FOUND");
    return userRows[0];
  });
}
