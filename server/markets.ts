/**
 * Server-side market pricing.
 *
 * The browser proposes a selection and the price it believes it saw; this
 * module decides whether that price is still real, and the ticket is always
 * priced from the server's own snapshot. Nothing here trusts the request body
 * for arithmetic.
 */

export type MarketCode = "1" | "X" | "2";

/** How far the submitted price may drift from the server price before we refuse. */
export const ODDS_TOLERANCE = 0.05;
/** A snapshot older than this is not a price, it is a guess. */
export const MARKET_MAX_AGE_MS = 15 * 60 * 1000;
/** Ceiling for a single price and for the combined ticket, matching the request schema. */
export const MAX_ODDS = 1_000;

export type MarketSnapshot = {
  fixtureId: string;
  code: MarketCode;
  price: number;
  capturedAt: Date;
  startsAt: Date | null;
  matchStatus: string | null;
};

export type PriceCheck =
  | { ok: true; price: number }
  | {
      ok: false;
      reason:
        "MARKET_UNAVAILABLE" | "MARKET_CLOSED" | "ODDS_STALE" | "ODDS_CHANGED";
    };

const HOME_TOKENS = ["۱", "1", "home", "host"];
const DRAW_TOKENS = ["x", "draw", "مساوی"];
const AWAY_TOKENS = ["۲", "2", "away", "guest"];

/**
 * Normalises every label the product uses (Persian digit, latin digit, market
 * name) to one canonical code. Returns null for markets we do not settle.
 */
export function canonicalMarketCode(
  input: string | undefined | null
): MarketCode | null {
  const value = (input ?? "").trim().toLowerCase();
  if (!value) return null;
  if (HOME_TOKENS.includes(value)) return "1";
  if (DRAW_TOKENS.includes(value)) return "X";
  if (AWAY_TOKENS.includes(value)) return "2";
  if (value.includes("میزبان")) return "1";
  if (value.includes("مساوی")) return "X";
  if (value.includes("مهمان")) return "2";
  return null;
}

export function marketKey(fixtureId: string, code: MarketCode) {
  return `${fixtureId}:${code}`;
}

/** A match we must not accept bets on any more. */
export function isMarketClosed(
  market: Pick<MarketSnapshot, "startsAt" | "matchStatus">,
  now = new Date()
) {
  const status = (market.matchStatus ?? "").trim().toLowerCase();
  if (!status)
    return market.startsAt ? market.startsAt.getTime() <= now.getTime() : false;
  if (status === "زنده" || status === "live") return true;
  if (status === "نمونه" || status === "preview" || status === "demo")
    return true;
  if (/(finished|ended|ft|aet|pen|canc|postp)/.test(status)) return true;
  // Scheduled matches close at kickoff; a missing kickoff is treated as still open
  // only while the feed says the match has not started.
  if (market.startsAt && market.startsAt.getTime() <= now.getTime())
    return true;
  return false;
}

export function checkMarketPrice(input: {
  market: MarketSnapshot | undefined;
  submittedOdds?: number;
  now?: Date;
}): PriceCheck {
  const now = input.now ?? new Date();
  const { market } = input;
  if (!market) return { ok: false, reason: "MARKET_UNAVAILABLE" };
  if (!Number.isFinite(market.price) || market.price <= 1)
    return { ok: false, reason: "MARKET_UNAVAILABLE" };
  if (isMarketClosed(market, now))
    return { ok: false, reason: "MARKET_CLOSED" };
  if (now.getTime() - market.capturedAt.getTime() > MARKET_MAX_AGE_MS)
    return { ok: false, reason: "ODDS_STALE" };

  const submitted = input.submittedOdds;
  if (
    typeof submitted === "number" &&
    Number.isFinite(submitted) &&
    submitted > 0
  ) {
    if (Math.abs(submitted - market.price) > market.price * ODDS_TOLERANCE)
      return { ok: false, reason: "ODDS_CHANGED" };
  }

  return { ok: true, price: market.price };
}

export type TicketPricing =
  | { ok: true; combinedOdds: number; potentialReturn: number }
  | { ok: false; reason: "ODDS_LIMIT_EXCEEDED" | "INVALID_STAKE" };

/**
 * Prices a ticket from server-side prices only. Rounds exactly like the
 * existing storage contract (2dp odds, 2dp return) so historic tickets stay
 * comparable.
 */
export function priceTicket(input: {
  stake: number;
  prices: number[];
}): TicketPricing {
  if (!Number.isFinite(input.stake) || input.stake <= 0)
    return { ok: false, reason: "INVALID_STAKE" };
  if (!input.prices.length) return { ok: false, reason: "INVALID_STAKE" };
  if (
    input.prices.some(
      price => !Number.isFinite(price) || price <= 1 || price > MAX_ODDS
    )
  ) {
    return { ok: false, reason: "ODDS_LIMIT_EXCEEDED" };
  }
  const combinedOdds = Number(
    input.prices.reduce((total, price) => total * price, 1).toFixed(2)
  );
  if (
    !Number.isFinite(combinedOdds) ||
    combinedOdds <= 1 ||
    combinedOdds > MAX_ODDS
  ) {
    return { ok: false, reason: "ODDS_LIMIT_EXCEEDED" };
  }
  const potentialReturn = Number((input.stake * combinedOdds).toFixed(2));
  if (!Number.isFinite(potentialReturn) || potentialReturn <= 0)
    return { ok: false, reason: "INVALID_STAKE" };
  return { ok: true, combinedOdds, potentialReturn };
}
