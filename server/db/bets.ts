import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { bets, notifications, sportsMarkets, supportedAssets, walletTransactions, wallets } from "../../drizzle/schema";
import { checkMarketPrice, marketKey, priceTicket, type MarketCode, type MarketSnapshot } from "../markets";
import { fixtureIdFromSelectionId, isSettleableFixtureId, outcomeSide } from "../settlement";
import { getDb } from "./core";

export type PlaceBetSelection = {
  id: string;
  match: string;
  market: string;
  /** Advisory only: the price the browser believes it showed. Never used for maths. */
  odds?: number;
};

export type PlaceBetInput = {
  userId: number;
  currency?: string;
  stake: number;
  selections: PlaceBetSelection[];
};

const MAX_SELECTIONS = 20;

function marketSideCode(selection: PlaceBetSelection): MarketCode | null {
  const side = outcomeSide(selection);
  if (side === "home") return "1";
  if (side === "draw") return "X";
  if (side === "away") return "2";
  return null;
}

/**
 * Places a ticket priced entirely from the server's market book.
 *
 * Every selection must resolve to a known fixture + outcome, carry a fresh
 * snapshot, still be open, and match the submitted price within tolerance.
 * A failure at any point aborts before a single unit leaves the wallet.
 */
export async function placeBet(input: PlaceBetInput) {
  if (!Number.isFinite(input.stake) || input.stake < 1) throw new Error("INVALID_STAKE");
  if (!input.selections.length) throw new Error("EMPTY_SELECTIONS");
  if (input.selections.length > MAX_SELECTIONS) throw new Error("TOO_MANY_SELECTIONS");

  const resolved = input.selections.map((selection) => {
    const fixtureId = fixtureIdFromSelectionId(selection.id);
    const code = marketSideCode(selection);
    if (!code || !fixtureId || !isSettleableFixtureId(fixtureId)) throw new Error("MARKET_UNAVAILABLE");
    return { selection, fixtureId, code };
  });

  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  return db.transaction(async (tx) => {
    const currency = input.currency?.trim().toUpperCase() || "USDT";
    const assetRows = await tx.select({ code: supportedAssets.code }).from(supportedAssets).where(and(eq(supportedAssets.code, currency), eq(supportedAssets.status, "active"))).limit(1);
    if (!assetRows[0]) throw new Error("UNSUPPORTED_CURRENCY");

    const walletRows = await tx.select().from(wallets).where(and(eq(wallets.userId, input.userId), eq(wallets.currency, currency))).limit(1);
    const wallet = walletRows[0];
    if (!wallet || Number(wallet.availableBalance) < input.stake) throw new Error("INSUFFICIENT_BALANCE");

    const fixtureIds = Array.from(new Set(resolved.map((item) => item.fixtureId)));
    const marketRows = await tx.select().from(sportsMarkets).where(inArray(sportsMarkets.fixtureId, fixtureIds));
    const book = new Map<string, MarketSnapshot>();
    for (const row of marketRows) {
      const code = row.code as MarketCode;
      book.set(marketKey(row.fixtureId, code), {
        fixtureId: row.fixtureId,
        code,
        price: Number(row.price),
        capturedAt: row.capturedAt,
        startsAt: row.startsAt ?? null,
        matchStatus: row.matchStatus ?? null,
      });
    }

    const now = new Date();
    const pricedSelections: PlaceBetSelection[] = [];
    const prices: number[] = [];
    for (const item of resolved) {
      const check = checkMarketPrice({
        market: book.get(marketKey(item.fixtureId, item.code)),
        submittedOdds: item.selection.odds,
        now,
      });
      if (!check.ok) throw new Error(check.reason);
      prices.push(check.price);
      pricedSelections.push({ ...item.selection, odds: check.price });
    }

    const pricing = priceTicket({ stake: input.stake, prices });
    if (!pricing.ok) throw new Error(pricing.reason);

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
      combinedOdds: pricing.combinedOdds.toFixed(4),
      potentialReturn: pricing.potentialReturn.toFixed(6),
      selectionsJson: JSON.stringify(pricedSelections),
      status: "pending",
    });
    await tx.insert(walletTransactions).values({ userId: input.userId, type: "bet_lock", status: "confirmed", currency, amount: input.stake.toFixed(6), referenceId: ticketCode });
    await tx.insert(notifications).values({ userId: input.userId, type: "bet", title: "بلیتت ثبت شد", message: `بلیت ${ticketCode} با مبلغ ${input.stake.toFixed(2)} ${currency} در وضعیت بررسی قرار گرفت.`, href: "/account" });
    return {
      id: Number(inserted[0].insertId),
      ticketCode,
      stake: input.stake,
      combinedOdds: pricing.combinedOdds,
      potentialReturn: pricing.potentialReturn,
      status: "pending" as const,
    };
  });
}

export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt)).limit(20);
  return rows.map((bet) => ({ ...bet, stake: Number(bet.stake), combinedOdds: Number(bet.combinedOdds), potentialReturn: Number(bet.potentialReturn), selections: JSON.parse(bet.selectionsJson) as Array<{ id: string; match: string; market: string; odds: number }> }));
}
