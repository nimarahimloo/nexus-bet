/**
 * Pure settlement rules for sports bets.
 *
 * Money never moves here; this module only answers "what happened to this
 * ticket" so the DB layer can apply an atomic, auditable transition.
 *
 * Market support is intentionally narrow: the feed only exposes 1X2
 * (home / draw / away). Anything we cannot prove from a final score stays
 * `pending` rather than being guessed — a stuck ticket is debuggable, a
 * wrongly settled one is not.
 */

export type FixtureState =
  "finished" | "live" | "scheduled" | "void" | "unknown";

export type FixtureResult = {
  fixtureId: string;
  state: FixtureState;
  homeGoals: number | null;
  awayGoals: number | null;
  /** Populated only when the provider could not be read. */
  error?: string | null;
};

export type SettleableSelection = {
  id: string;
  match: string;
  market: string;
  odds: number;
};

export type SelectionOutcome = "won" | "lost" | "void" | "pending";
export type BetOutcome = "won" | "lost" | "void" | "pending";

export type SettlementMoney = {
  /** Credit to `availableBalance`. */
  availableDelta: number;
  /** Delta to `lockedBalance` (always <= 0). */
  lockedDelta: number;
  /** Amount written to the ledger row. */
  ledgerAmount: number;
};

const HOME_CODES = new Set(["۱", "1", "home", "host"]);
const DRAW_CODES = new Set(["x", "draw", "مساوی"]);
const AWAY_CODES = new Set(["۲", "2", "away", "guest"]);

export const round6 = (value: number) => Number(value.toFixed(6));

/** Fixture ids we must never settle: seeded preview data is not a real event. */
export function isSettleableFixtureId(fixtureId: string) {
  const normalized = fixtureId.trim().toLowerCase();
  if (!normalized) return false;
  return !normalized.startsWith("preview") && !normalized.startsWith("demo");
}

/**
 * Selection ids are built as `${fixtureId}-${label}` (see Matches/Home), e.g.
 * `1234567-۲`. The label is always the last segment, so a fixture id that
 * contains dashes still parses correctly.
 */
export function fixtureIdFromSelectionId(selectionId: string) {
  const trimmed = selectionId.trim();
  const separator = trimmed.lastIndexOf("-");
  const candidate = separator > 0 ? trimmed.slice(0, separator) : trimmed;
  return candidate.trim();
}

export function selectionCode(selectionId: string) {
  const trimmed = selectionId.trim();
  const separator = trimmed.lastIndexOf("-");
  return (separator >= 0 ? trimmed.slice(separator + 1) : "")
    .trim()
    .toLowerCase();
}

/**
 * Resolve which side a selection backs. Falls back to the Persian market name
 * when the id carries no usable code, and returns null when we genuinely do
 * not know — callers must treat null as "not settleable".
 */
export function outcomeSide(
  selection: Pick<SettleableSelection, "id" | "market">
): "home" | "draw" | "away" | null {
  const code = selectionCode(selection.id);
  if (HOME_CODES.has(code)) return "home";
  if (DRAW_CODES.has(code)) return "draw";
  if (AWAY_CODES.has(code)) return "away";

  const market = selection.market.trim().toLowerCase();
  if (market.includes("میزبان") || market.includes("home")) return "home";
  if (market.includes("مساوی") || market.includes("draw")) return "draw";
  if (market.includes("مهمان") || market.includes("away")) return "away";
  return null;
}

export function selectionOutcome(
  selection: Pick<SettleableSelection, "id" | "market">,
  result: FixtureResult | undefined | null
): SelectionOutcome {
  if (!result) return "pending";
  if (result.state === "void") return "void";
  if (result.state !== "finished") return "pending";
  if (result.homeGoals == null || result.awayGoals == null) return "pending";
  if (!isSettleableFixtureId(result.fixtureId)) return "pending";

  const side = outcomeSide(selection);
  if (!side) return "pending";

  const actual =
    result.homeGoals > result.awayGoals
      ? "home"
      : result.homeGoals === result.awayGoals
        ? "draw"
        : "away";
  return side === actual ? "won" : "lost";
}

/**
 * Ticket-level outcome for an accumulator:
 * - one losing leg loses the ticket, regardless of the rest
 * - otherwise a void leg refunds the whole ticket (no partial-odds maths in v1)
 * - all legs won wins the ticket
 * - anything unresolved keeps it pending
 */
export function settleBetOutcome(
  selections: SettleableSelection[],
  results: Map<string, FixtureResult>
): BetOutcome {
  if (!selections.length) return "pending";
  const outcomes = selections.map(selection =>
    selectionOutcome(
      selection,
      results.get(fixtureIdFromSelectionId(selection.id))
    )
  );
  if (outcomes.includes("lost")) return "lost";
  if (outcomes.includes("void")) return "void";
  if (outcomes.every(outcome => outcome === "won")) return "won";
  return "pending";
}

/**
 * Ledger arithmetic for a settled ticket.
 * - won:  locked -> available, paying the recorded potentialReturn
 * - lost: locked is consumed, nothing returns
 * - void: the full stake goes back to available
 */
export function settlementMoney(
  outcome: Exclude<BetOutcome, "pending">,
  stake: number,
  potentialReturn: number
): SettlementMoney {
  const lockedStake = round6(Math.abs(stake));
  if (outcome === "won") {
    const payout = round6(potentialReturn);
    return {
      availableDelta: payout,
      lockedDelta: -lockedStake,
      ledgerAmount: payout,
    };
  }
  if (outcome === "void") {
    return {
      availableDelta: lockedStake,
      lockedDelta: -lockedStake,
      ledgerAmount: lockedStake,
    };
  }
  return { availableDelta: 0, lockedDelta: -lockedStake, ledgerAmount: 0 };
}
