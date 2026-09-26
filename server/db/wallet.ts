import { and, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { activityRewardLedger, bets, crashBets, crashRounds, gameCatalog, localCredentials, notifications, passwordResetTokens, promotionClaims, promotions, rewardLedger, sportAlertPreferences, sportWatchlist, supportedAssets, tournamentEntries, tournaments, users, vipActivity, walletTransactions, wallets, wheelSpins } from "../../drizzle/schema";
import { getUtcDateKey, selectWheelReward } from "../wheel";
import { randomUUID } from "node:crypto";
import { createCrashSeed, crashMultiplierFromSeed, isCrashed, multiplierAt, rememberPendingSeed, takePendingSeed } from "../crash";
import { ENV } from '../_core/env';
import { getDb } from "./core";

function parseNetworks(networksJson: string): string[] {
  try {
    const parsed = JSON.parse(networksJson);
    return Array.isArray(parsed) ? parsed.filter((network): network is string => typeof network === "string") : [];
  } catch {
    return [];
  }
}

/** Stable order_id sent to NOWPayments so IPN can resolve the ledger row. */
export function walletOrderId(transactionId: number) {
  return `wallet-${transactionId}`;
}

export function parseWalletOrderId(orderId: string | undefined): number | null {
  if (!orderId) return null;
  const match = /^wallet-(\d+)$/.exec(orderId.trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getActiveAssets() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(supportedAssets).where(eq(supportedAssets.status, "active")).orderBy(desc(supportedAssets.isBase), supportedAssets.name);
  return rows.map(({ networksJson, ...asset }) => ({ ...asset, networks: parseNetworks(networksJson) }));
}

export async function getWalletPortfolio(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const assets = await getActiveAssets();
  const rows = await db.select().from(wallets).where(eq(wallets.userId, userId));
  return assets.map((asset) => {
    const wallet = rows.find((item) => item.currency === asset.code);
    return { ...asset, availableBalance: Number(wallet?.availableBalance ?? 0), lockedBalance: Number(wallet?.lockedBalance ?? 0), walletId: wallet?.id ?? null };
  });
}

export async function getWalletTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(50);
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function getWalletTransactionById(transactionId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(walletTransactions).where(eq(walletTransactions.id, transactionId)).limit(1);
  return rows[0] ?? null;
}

export async function getWalletTransactionByProviderEvent(provider: string, providerEventId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(walletTransactions)
    .where(and(eq(walletTransactions.provider, provider), eq(walletTransactions.providerEventId, providerEventId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function requestWalletTransaction(input: { userId: number; type: "deposit" | "withdrawal"; amount: number; currency?: string; network?: string; address?: string }) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("INVALID_AMOUNT");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const currency = input.currency?.trim().toUpperCase() || "USDT";
  return db.transaction(async (tx) => {
    const assets = await tx.select({ code: supportedAssets.code }).from(supportedAssets).where(and(eq(supportedAssets.code, currency), eq(supportedAssets.status, "active"))).limit(1);
    if (!assets[0]) throw new Error("UNSUPPORTED_CURRENCY");
    // Ensure wallet row exists before deposit credit or withdrawal lock.
    await tx.insert(wallets).values({ userId: input.userId, currency }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    if (input.type === "withdrawal") {
      if (!input.address?.trim()) throw new Error("WITHDRAWAL_ADDRESS_REQUIRED");
      const updated = await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} - ${input.amount}`, lockedBalance: sql`${wallets.lockedBalance} + ${input.amount}`, updatedAt: new Date() }).where(and(eq(wallets.userId, input.userId), eq(wallets.currency, currency), gte(wallets.availableBalance, input.amount.toFixed(6))));
      if (!Number(updated[0]?.affectedRows)) throw new Error("INSUFFICIENT_BALANCE");
    }
    const inserted = await tx.insert(walletTransactions).values({
      userId: input.userId,
      type: input.type,
      status: "pending",
      currency,
      amount: input.amount.toFixed(6),
      network: input.network ?? "BEP20",
      address: input.address,
      referenceId: walletOrderId(0), // placeholder; rewritten after insertId known
    });
    const id = Number(inserted[0].insertId);
    await tx.update(walletTransactions).set({ referenceId: walletOrderId(id) }).where(eq(walletTransactions.id, id));
    return { id, type: input.type, status: "pending" as const, currency, amount: input.amount, orderId: walletOrderId(id) };
  });
}

export async function attachWalletProviderTransaction(input: { transactionId: number; provider: string; providerEventId: string; providerStatus: string; payloadJson?: string; txHash?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const result = await db.update(walletTransactions).set({ provider: input.provider, providerEventId: input.providerEventId, providerStatus: input.providerStatus, providerPayloadJson: input.payloadJson, txHash: input.txHash, updatedAt: new Date() }).where(and(eq(walletTransactions.id, input.transactionId), eq(walletTransactions.status, "pending")));
  return Number(result[0]?.affectedRows) > 0;
}

export async function settleWalletProviderTransaction(input: {
  transactionId: number;
  status: "confirmed" | "failed";
  provider: string;
  providerEventId: string;
  providerStatus: string;
  providerCurrency?: string;
  providerNetwork?: string;
  providerAmount?: number;
  payloadJson?: string;
  txHash?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(walletTransactions).where(eq(walletTransactions.id, input.transactionId)).limit(1);
    const transaction = rows[0];
    if (!transaction) throw new Error("WALLET_TRANSACTION_NOT_FOUND");
    if (transaction.providerEventId && transaction.providerEventId !== input.providerEventId) throw new Error("PROVIDER_EVENT_MISMATCH");
    if (transaction.status !== "pending") return { applied: false, status: transaction.status };
    const amount = Number(transaction.amount);
    const normalizedProviderCurrency = input.providerCurrency?.toUpperCase().replace(/BSC$/, "");
    if (normalizedProviderCurrency && normalizedProviderCurrency !== transaction.currency) throw new Error("PROVIDER_CURRENCY_MISMATCH");
    if (input.providerNetwork && input.providerNetwork.toUpperCase() !== "BEP20") throw new Error("PROVIDER_NETWORK_MISMATCH");
    if (input.providerAmount !== undefined && Math.abs(input.providerAmount - amount) > 0.000001) throw new Error("PROVIDER_AMOUNT_MISMATCH");

    await tx.insert(wallets).values({ userId: transaction.userId, currency: transaction.currency }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

    if (input.status === "confirmed" && transaction.type === "deposit") {
      await tx.update(wallets).set({ availableBalance: sql`${wallets.availableBalance} + ${amount}`, updatedAt: new Date() }).where(and(eq(wallets.userId, transaction.userId), eq(wallets.currency, transaction.currency)));
    } else if (transaction.type === "withdrawal") {
      const set =
        input.status === "confirmed"
          ? { lockedBalance: sql`${wallets.lockedBalance} - ${amount}`, updatedAt: new Date() }
          : { availableBalance: sql`${wallets.availableBalance} + ${amount}`, lockedBalance: sql`${wallets.lockedBalance} - ${amount}`, updatedAt: new Date() };
      const updated = await tx.update(wallets).set(set).where(and(eq(wallets.userId, transaction.userId), eq(wallets.currency, transaction.currency), sql`${wallets.lockedBalance} >= ${amount.toFixed(6)}`));
      if (!Number(updated[0]?.affectedRows)) throw new Error("LOCKED_BALANCE_MISMATCH");
    }
    await tx.update(walletTransactions).set({
      status: input.status,
      provider: input.provider,
      providerEventId: input.providerEventId,
      providerStatus: input.providerStatus,
      providerPayloadJson: input.payloadJson,
      txHash: input.txHash,
      updatedAt: new Date(),
    }).where(and(eq(walletTransactions.id, transaction.id), eq(walletTransactions.status, "pending")));
    await tx.insert(notifications).values({
      userId: transaction.userId,
      type: "wallet",
      title: "وضعیت کیف پول به‌روزرسانی شد",
      message: `درخواست ${transaction.type === "deposit" ? "واریز" : "برداشت"} ${amount.toFixed(6)} ${transaction.currency} اکنون ${input.status === "confirmed" ? "تأیید" : "ناموفق"} است.`,
      href: "/wallet",
    });
    return { applied: true, status: input.status };
  });
}

export async function getOrCreateWalletByUserId(userId: number, currency = "USDT") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get wallet: database not available");
    return undefined;
  }

  const normalizedCurrency = currency.trim().toUpperCase();
  const assetRows = await db.select({ code: supportedAssets.code }).from(supportedAssets).where(and(eq(supportedAssets.code, normalizedCurrency), eq(supportedAssets.status, "active"))).limit(1);
  if (!assetRows[0]) throw new Error("UNSUPPORTED_CURRENCY");
  await db.insert(wallets).values({ userId, currency: normalizedCurrency }).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });

  const result = await db.select().from(wallets).where(and(eq(wallets.userId, userId), eq(wallets.currency, normalizedCurrency))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
