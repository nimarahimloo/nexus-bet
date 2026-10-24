import { and, asc, eq, gte, sql } from "drizzle-orm";
import { bets, notifications, walletTransactions, wallets } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { fetchFixtureResult, unknownFixtureResult } from "../fixtureResults";
import {
  fixtureIdFromSelectionId,
  isSettleableFixtureId,
  settlementMoney,
  settleBetOutcome,
  type BetOutcome,
  type FixtureResult,
  type SettleableSelection,
  type SettlementMoney,
} from "../settlement";
import { getDb } from "./core";

export type SettlementDecision = {
  ticketCode: string;
  status: Exclude<BetOutcome, "pending">;
  ledgerAmount: number;
};

export type SettlementSummary = {
  dryRun: boolean;
  sportsApiConfigured: boolean;
  scanned: number;
  settledWon: number;
  settledLost: number;
  refundedVoid: number;
  stillPending: number;
  unresolvedFixtures: number;
  skipped: number;
  failed: number;
  decisions: SettlementDecision[];
};

export type SettlePendingOptions = {
  limit?: number;
  dryRun?: boolean;
  /** Injectable for tests / alternate providers. Defaults to API-Football. */
  resolveFixture?: (fixtureId: string) => Promise<FixtureResult>;
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const MAX_FIXTURES_PER_RUN = 40;
const MAX_DECISIONS_IN_RESPONSE = 25;

function clampLimit(value: number | undefined) {
  if (!Number.isFinite(value ?? NaN)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(value as number), 1), MAX_LIMIT);
}

/** Tolerates rows written by older builds; a broken row must not stop the run. */
export function parseSelections(json: string): SettleableSelection[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.market !== "string") return [];
      const odds = Number(record.odds);
      return [{
        id: record.id,
        match: typeof record.match === "string" ? record.match : "",
        market: record.market,
        odds: Number.isFinite(odds) ? odds : 0,
      }];
    });
  } catch {
    return [];
  }
}

function notificationFor(input: { outcome: Exclude<BetOutcome, "pending">; ticketCode: string; stake: number; currency: string; money: SettlementMoney }) {
  if (input.outcome === "won") {
    return {
      type: "bet" as const,
      title: "بلیت برنده شد",
      message: `بلیت ${input.ticketCode} تسویه شد و ${input.money.ledgerAmount.toFixed(2)} ${input.currency} به موجودی قابل‌استفاده اضافه شد.`,
      href: "/account",
    };
  }
  if (input.outcome === "void") {
    return {
      type: "bet" as const,
      title: "بازگشت مبلغ بلیت",
      message: `رویداد بلیت ${input.ticketCode} لغو شد و ${input.stake.toFixed(2)} ${input.currency} به موجودی برگشت.`,
      href: "/account",
    };
  }
  return {
    type: "bet" as const,
    title: "بلیت باخت",
    message: `بلیت ${input.ticketCode} تسویه شد؛ مبلغ ${input.stake.toFixed(2)} ${input.currency} از موجودی قفل‌شده کسر شد.`,
    href: "/account",
  };
}

async function applySettlement(input: {
  betId: number;
  userId: number;
  currency: string;
  stake: number;
  ticketCode: string;
  outcome: Exclude<BetOutcome, "pending">;
  money: SettlementMoney;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  return db.transaction(async (tx) => {
    // Claim the ticket first: if another worker already settled it, this is a
    // no-op and no money moves. This is the idempotency guard for overlapping
    // cron runs and manual triggers.
    const claimed = await tx
      .update(bets)
      .set({ status: input.outcome, updatedAt: new Date() })
      .where(and(eq(bets.id, input.betId), eq(bets.status, "pending")));
    if (!Number(claimed[0]?.affectedRows)) return false;

    const updated = await tx
      .update(wallets)
      .set({
        availableBalance: sql`${wallets.availableBalance} + ${input.money.availableDelta.toFixed(6)}`,
        lockedBalance: sql`${wallets.lockedBalance} + ${input.money.lockedDelta.toFixed(6)}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(wallets.userId, input.userId),
        eq(wallets.currency, input.currency),
        gte(wallets.lockedBalance, input.stake.toFixed(6)),
      ));
    // Guarded update: a locked balance smaller than the stake means the ledger
    // already disagrees with the ticket, so roll the whole thing back.
    if (!Number(updated[0]?.affectedRows)) throw new Error("LOCKED_BALANCE_MISMATCH");

    await tx.insert(walletTransactions).values({
      userId: input.userId,
      type: "bet_settlement",
      status: "confirmed",
      currency: input.currency,
      amount: input.money.ledgerAmount.toFixed(6),
      referenceId: input.ticketCode,
    });

    await tx.insert(notifications).values({
      userId: input.userId,
      ...notificationFor({
        outcome: input.outcome,
        ticketCode: input.ticketCode,
        stake: input.stake,
        currency: input.currency,
        money: input.money,
      }),
    });

    return true;
  });
}

/**
 * Settle every pending sports ticket whose fixtures now have a final score.
 *
 * Rules:
 * - one losing leg loses the ticket; a void leg refunds it; all legs must win
 * - unresolved / live / unreadable fixtures leave the ticket pending
 * - the ledger transition is claimed inside a transaction, so repeated runs
 *   and concurrent workers cannot pay a ticket twice
 */
export async function settlePendingSportsBets(options: SettlePendingOptions = {}): Promise<SettlementSummary> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const limit = clampLimit(options.limit);
  const dryRun = options.dryRun ?? false;
  const resolveFixture = options.resolveFixture ?? ((fixtureId: string) => fetchFixtureResult(fixtureId, ENV.sportsApiKey));

  const summary: SettlementSummary = {
    dryRun,
    sportsApiConfigured: Boolean(ENV.sportsApiKey.trim()),
    scanned: 0,
    settledWon: 0,
    settledLost: 0,
    refundedVoid: 0,
    stillPending: 0,
    unresolvedFixtures: 0,
    skipped: 0,
    failed: 0,
    decisions: [],
  };

  const rows = await db
    .select({
      id: bets.id,
      userId: bets.userId,
      ticketCode: bets.ticketCode,
      currency: bets.currency,
      stake: bets.stake,
      potentialReturn: bets.potentialReturn,
      selectionsJson: bets.selectionsJson,
    })
    .from(bets)
    .where(eq(bets.status, "pending"))
    .orderBy(asc(bets.createdAt))
    .limit(limit);

  summary.scanned = rows.length;
  if (!rows.length) return summary;

  const tickets = rows.map((row) => ({ row, selections: parseSelections(row.selectionsJson) }));

  const fixtureIds = Array.from(new Set(
    tickets
      .flatMap((ticket) => ticket.selections.map((selection) => fixtureIdFromSelectionId(selection.id)))
      .filter((fixtureId) => Boolean(fixtureId) && isSettleableFixtureId(fixtureId)),
  )).slice(0, MAX_FIXTURES_PER_RUN);

  const results = new Map<string, FixtureResult>();
  await Promise.all(fixtureIds.map(async (fixtureId) => {
    try {
      results.set(fixtureId, await resolveFixture(fixtureId));
    } catch (error) {
      results.set(fixtureId, unknownFixtureResult(fixtureId, error instanceof Error ? error.message : "RESOLVER_FAILED"));
    }
  }));
  summary.unresolvedFixtures = Array.from(results.values()).filter((result) => result.state === "unknown").length;

  for (const { row, selections } of tickets) {
    const outcome = settleBetOutcome(selections, results);
    if (outcome === "pending") {
      summary.stillPending += 1;
      continue;
    }

    const stake = Number(row.stake);
    const potentialReturn = Number(row.potentialReturn);
    if (!Number.isFinite(stake) || !Number.isFinite(potentialReturn) || stake <= 0) {
      summary.failed += 1;
      continue;
    }

    const money = settlementMoney(outcome, stake, potentialReturn);
    if (summary.decisions.length < MAX_DECISIONS_IN_RESPONSE) {
      summary.decisions.push({ ticketCode: row.ticketCode, status: outcome, ledgerAmount: money.ledgerAmount });
    }

    if (outcome === "won") summary.settledWon += 1;
    else if (outcome === "lost") summary.settledLost += 1;
    else summary.refundedVoid += 1;

    if (dryRun) continue;

    try {
      const applied = await applySettlement({
        betId: row.id,
        userId: row.userId,
        currency: row.currency,
        stake,
        ticketCode: row.ticketCode,
        outcome,
        money,
      });
      if (!applied) {
        summary.skipped += 1;
        if (outcome === "won") summary.settledWon -= 1;
        else if (outcome === "lost") summary.settledLost -= 1;
        else summary.refundedVoid -= 1;
      }
    } catch (error) {
      summary.failed += 1;
      if (outcome === "won") summary.settledWon -= 1;
      else if (outcome === "lost") summary.settledLost -= 1;
      else summary.refundedVoid -= 1;
      console.warn(`[Settlement] failed for ${row.ticketCode}:`, error);
    }
  }

  return summary;
}
