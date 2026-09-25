import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { InsertUser, activityRewardLedger, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, sportAlertPreferences, sportWatchlist, supportedAssets, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "../wheel";
import { randomUUID } from "node:crypto";
import { createCrashSeed, crashMultiplierFromSeed, isCrashed, multiplierAt, rememberPendingSeed, takePendingSeed } from "../crash";
import { ENV } from '../_core/env';
import { getDb } from "./core";

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

export async function getSportWatchlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sportWatchlist).where(eq(sportWatchlist.userId, userId)).orderBy(desc(sportWatchlist.createdAt));
}

export async function addSportWatchlist(userId: number, input: { eventId: string; sport: string; league: string; home: string; away: string; eventTime?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const eventId = input.eventId.trim();
  const existing = await db.select().from(sportWatchlist).where(and(eq(sportWatchlist.userId, userId), eq(sportWatchlist.eventId, eventId))).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(sportWatchlist).values({ userId, eventId, sport: input.sport.trim(), league: input.league.trim(), home: input.home.trim(), away: input.away.trim(), eventTime: input.eventTime ?? null });
  const rows = await db.select().from(sportWatchlist).where(eq(sportWatchlist.id, Number(inserted[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function removeSportWatchlist(userId: number, watchlistId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.delete(sportAlertPreferences).where(and(eq(sportAlertPreferences.userId, userId), eq(sportAlertPreferences.watchlistId, watchlistId)));
  await db.delete(sportWatchlist).where(and(eq(sportWatchlist.id, watchlistId), eq(sportWatchlist.userId, userId)));
  return { success: true as const };
}

export async function getSportAlertPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sportAlertPreferences).where(eq(sportAlertPreferences.userId, userId)).orderBy(desc(sportAlertPreferences.updatedAt));
}

export async function upsertSportAlertPreference(userId: number, input: { watchlistId: number; alertType: "kickoff" | "odds_change" | "result"; threshold?: number | null; enabled: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const watch = await db.select({ id: sportWatchlist.id }).from(sportWatchlist).where(and(eq(sportWatchlist.id, input.watchlistId), eq(sportWatchlist.userId, userId))).limit(1);
  if (!watch[0]) throw new Error("WATCHLIST_NOT_FOUND");
  const existing = await db.select().from(sportAlertPreferences).where(and(eq(sportAlertPreferences.userId, userId), eq(sportAlertPreferences.watchlistId, input.watchlistId), eq(sportAlertPreferences.alertType, input.alertType))).limit(1);
  if (existing[0]) {
    await db.update(sportAlertPreferences).set({ enabled: input.enabled ? 1 : 0, threshold: input.threshold == null ? null : input.threshold.toFixed(4), updatedAt: new Date() }).where(and(eq(sportAlertPreferences.id, existing[0].id), eq(sportAlertPreferences.userId, userId)));
    return { ...existing[0], enabled: input.enabled ? 1 : 0, threshold: input.threshold == null ? null : input.threshold.toFixed(4) };
  }
  const inserted = await db.insert(sportAlertPreferences).values({ userId, watchlistId: input.watchlistId, alertType: input.alertType, threshold: input.threshold == null ? null : input.threshold.toFixed(4), enabled: input.enabled ? 1 : 0 });
  const rows = await db.select().from(sportAlertPreferences).where(eq(sportAlertPreferences.id, Number(inserted[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function dispatchDueSportAlerts() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const now = new Date();
  const horizon = new Date(now.getTime() + 15 * 60 * 1000);
  const preferences = await db.select().from(sportAlertPreferences).where(and(eq(sportAlertPreferences.enabled, 1), eq(sportAlertPreferences.alertType, "kickoff")));
  let sent = 0;
  for (const preference of preferences) {
    const watchRows = await db.select().from(sportWatchlist).where(eq(sportWatchlist.id, preference.watchlistId)).limit(1);
    const watch = watchRows[0];
    if (!watch?.eventTime || watch.eventTime < now || watch.eventTime > horizon) continue;
    if (preference.lastNotifiedAt && preference.lastNotifiedAt >= watch.eventTime) continue;
    await db.insert(notifications).values({ userId: preference.userId, type: "sports", title: "شروع مسابقه نزدیک است", message: `${watch.home} — ${watch.away} تا چند دقیقهٔ دیگر آغاز می‌شود.`, href: "/matches" });
    await db.update(sportAlertPreferences).set({ lastNotifiedAt: new Date() }).where(and(eq(sportAlertPreferences.id, preference.id), eq(sportAlertPreferences.userId, preference.userId), isNull(sportAlertPreferences.lastNotifiedAt)));
    sent += 1;
  }
  return { sent };
}
