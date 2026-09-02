import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { gameCatalog, notifications, promotions, supportedAssets, users, walletTransactions, wallets } from "../drizzle/schema";

function parseNetworks(networksJson: string): string[] {
  try {
    const parsed = JSON.parse(networksJson);
    return Array.isArray(parsed) ? parsed.filter((network): network is string => typeof network === "string") : [];
  } catch {
    return [];
  }
}

export async function getAdminOverview() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const [userRows, userCountRows, assetRows, gameRows, promotionRows, transactionRows] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(50),
    db.select({ value: count() }).from(users),
    db.select().from(supportedAssets).orderBy(desc(supportedAssets.isBase), supportedAssets.name),
    db.select().from(gameCatalog).orderBy(desc(gameCatalog.updatedAt), gameCatalog.title).limit(100),
    db.select().from(promotions).orderBy(desc(promotions.updatedAt)).limit(50),
    db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt)).limit(50),
  ]);
  return {
    counts: {
      users: Number(userCountRows[0]?.value ?? userRows.length),
      activeAssets: assetRows.filter((asset) => asset.status === "active").length,
      activeGames: gameRows.filter((game) => game.status === "active").length,
      activePromotions: promotionRows.filter((promotion) => promotion.status === "active").length,
      pendingTransactions: transactionRows.filter((transaction) => transaction.status === "pending").length,
    },
    users: userRows,
    assets: assetRows.map(({ networksJson, ...asset }) => ({ ...asset, networks: parseNetworks(networksJson) })),
    games: gameRows,
    promotions: promotionRows,
    transactions: transactionRows.map((transaction) => ({ ...transaction, amount: Number(transaction.amount) })),
  };
}

export async function createAdminNotification(input: { target: "user" | "all"; userId?: number; type: "system" | "bet" | "wallet" | "reward" | "sports"; title: string; message: string; href?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const targetUserIds = input.target === "all" ? (await db.select({ id: users.id }).from(users)).map((user) => user.id) : input.userId ? [input.userId] : [];
  if (!targetUserIds.length) throw new Error("NOTIFICATION_TARGET_REQUIRED");
  const inserted = await db.insert(notifications).values(targetUserIds.map((userId) => ({ userId, type: input.type, title: input.title.trim(), message: input.message.trim(), href: input.href?.trim() || null })));
  return { count: targetUserIds.length, firstId: Number(inserted[0]?.insertId ?? 0) };
}

export async function upsertAdminAsset(input: { code: string; name: string; symbol: string; decimals: number; status: "active" | "maintenance" | "disabled"; networks: string[]; isBase?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const code = input.code.trim().toUpperCase();
  const networksJson = JSON.stringify(input.networks.map((network) => network.trim()).filter(Boolean));
  await db.insert(supportedAssets).values({ code, name: input.name.trim(), symbol: input.symbol.trim().toUpperCase(), decimals: input.decimals, isBase: input.isBase ? 1 : 0, status: input.status, networksJson }).onDuplicateKeyUpdate({ set: { name: input.name.trim(), symbol: input.symbol.trim().toUpperCase(), decimals: input.decimals, status: input.status, networksJson, isBase: input.isBase ? 1 : 0, updatedAt: new Date() } });
  return { code, status: input.status };
}

export async function updateAdminAssetStatus(assetId: number, status: "active" | "maintenance" | "disabled") {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.update(supportedAssets).set({ status, updatedAt: new Date() }).where(eq(supportedAssets.id, assetId));
  return { success: true as const };
}

export async function updateAdminGameStatus(gameId: number, status: "active" | "maintenance" | "disabled") {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.update(gameCatalog).set({ status, updatedAt: new Date() }).where(eq(gameCatalog.id, gameId));
  return { success: true as const };
}

export async function updateAdminPromotionStatus(promotionId: number, status: "draft" | "active" | "expired") {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.update(promotions).set({ status, updatedAt: new Date() }).where(eq(promotions.id, promotionId));
  return { success: true as const };
}

export async function reviewAdminWalletTransaction(input: { transactionId: number; status: "confirmed" | "failed" | "cancelled" }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(walletTransactions).where(and(eq(walletTransactions.id, input.transactionId), eq(walletTransactions.status, "pending"))).limit(1);
    const transaction = rows[0];
    if (!transaction) throw new Error("TRANSACTION_NOT_PENDING");
    const amount = Number(transaction.amount);
    if (input.status === "confirmed") {
      await tx.insert(wallets).values({ userId: transaction.userId, currency: transaction.currency }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
      if (transaction.type === "deposit") {
        await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} + ${amount}`, updatedAt: new Date() }).where(and(eq(wallets.userId, transaction.userId), eq(wallets.currency, transaction.currency)));
      } else if (transaction.type === "withdrawal") {
        const updated = await tx.update(wallets).set({ lockedBalance: sql`${wallets.lockedBalance} - ${amount}`, updatedAt: new Date() }).where(and(eq(wallets.userId, transaction.userId), eq(wallets.currency, transaction.currency), sql`${wallets.lockedBalance} >= ${amount.toFixed(6)}`));
        if (!Number(updated[0]?.affectedRows)) throw new Error("LOCKED_BALANCE_MISMATCH");
      }
    } else if (transaction.type === "withdrawal") {
      const updated = await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} + ${amount}`, lockedBalance: sql`${wallets.lockedBalance} - ${amount}`, updatedAt: new Date() }).where(and(eq(wallets.userId, transaction.userId), eq(wallets.currency, transaction.currency), sql`${wallets.lockedBalance} >= ${amount.toFixed(6)}`));
      if (!Number(updated[0]?.affectedRows)) throw new Error("LOCKED_BALANCE_MISMATCH");
    }
    await tx.update(walletTransactions).set({ status: input.status, updatedAt: new Date() }).where(and(eq(walletTransactions.id, input.transactionId), eq(walletTransactions.status, "pending")));
    await tx.insert(notifications).values({ userId: transaction.userId, type: "wallet", title: "وضعیت کیف پول به‌روزرسانی شد", message: `درخواست ${transaction.type === "deposit" ? "واریز" : "برداشت"} ${amount.toFixed(6)} ${transaction.currency} اکنون ${input.status} است.`, href: "/wallet" });
    return { success: true as const, status: input.status };
  });
}
