import { describe, expect, it } from "vitest";
import {
  MARKET_MAX_AGE_MS,
  ODDS_TOLERANCE,
  canonicalMarketCode,
  checkMarketPrice,
  isMarketClosed,
  marketKey,
  priceTicket,
  type MarketSnapshot,
} from "./markets";

const NOW = new Date("2026-10-25T12:00:00.000Z");

const market = (overrides: Partial<MarketSnapshot> = {}): MarketSnapshot => ({
  fixtureId: "1234567",
  code: "1",
  price: 2,
  capturedAt: new Date(NOW.getTime() - 60_000),
  startsAt: new Date(NOW.getTime() + 60 * 60_000),
  matchStatus: "امروز",
  ...overrides,
});

describe("market code normalisation", () => {
  it("maps every label the product uses onto one canonical code", () => {
    expect(canonicalMarketCode("۱")).toBe("1");
    expect(canonicalMarketCode("1")).toBe("1");
    expect(canonicalMarketCode("برد میزبان")).toBe("1");
    expect(canonicalMarketCode("X")).toBe("X");
    expect(canonicalMarketCode("x")).toBe("X");
    expect(canonicalMarketCode("مساوی")).toBe("X");
    expect(canonicalMarketCode("۲")).toBe("2");
    expect(canonicalMarketCode("برد مهمان")).toBe("2");
  });

  it("returns null for markets it cannot settle", () => {
    expect(canonicalMarketCode("تعداد گل")).toBeNull();
    expect(canonicalMarketCode("")).toBeNull();
    expect(canonicalMarketCode(undefined)).toBeNull();
  });

  it("builds a stable snapshot key", () => {
    expect(marketKey("1234567", "X")).toBe("1234567:X");
  });
});

describe("price validation", () => {
  it("accepts a fresh, open market whose price matches", () => {
    expect(checkMarketPrice({ market: market(), submittedOdds: 2, now: NOW })).toEqual({ ok: true, price: 2 });
  });

  it("accepts a small drift inside the tolerance band", () => {
    const drifted = 2 * (1 + ODDS_TOLERANCE) - 0.0001;
    expect(checkMarketPrice({ market: market(), submittedOdds: drifted, now: NOW }).ok).toBe(true);
  });

  it("rejects a price far from the server book", () => {
    expect(checkMarketPrice({ market: market(), submittedOdds: 2 * (1 + ODDS_TOLERANCE) + 0.01, now: NOW }))
      .toEqual({ ok: false, reason: "ODDS_CHANGED" });
    expect(checkMarketPrice({ market: market(), submittedOdds: 1_000, now: NOW }))
      .toEqual({ ok: false, reason: "ODDS_CHANGED" });
  });

  it("prices the ticket even when the client omits odds", () => {
    expect(checkMarketPrice({ market: market(), now: NOW })).toEqual({ ok: true, price: 2 });
  });

  it("rejects an unknown market", () => {
    expect(checkMarketPrice({ market: undefined, submittedOdds: 2, now: NOW }))
      .toEqual({ ok: false, reason: "MARKET_UNAVAILABLE" });
    expect(checkMarketPrice({ market: market({ price: 1 }), now: NOW }))
      .toEqual({ ok: false, reason: "MARKET_UNAVAILABLE" });
  });

  it("rejects a stale snapshot instead of honouring an old price", () => {
    const stale = market({ capturedAt: new Date(NOW.getTime() - MARKET_MAX_AGE_MS - 1) });
    expect(checkMarketPrice({ market: stale, submittedOdds: 2, now: NOW }))
      .toEqual({ ok: false, reason: "ODDS_STALE" });
  });

  it("closes the market at kickoff, on live status and on preview data", () => {
    expect(isMarketClosed(market({ startsAt: new Date(NOW.getTime() - 1) }), NOW)).toBe(true);
    expect(isMarketClosed(market({ matchStatus: "زنده" }), NOW)).toBe(true);
    expect(isMarketClosed(market({ matchStatus: "نمونه" }), NOW)).toBe(true);
    expect(isMarketClosed(market({ matchStatus: "finished" }), NOW)).toBe(true);
    expect(isMarketClosed(market(), NOW)).toBe(false);
  });

  it("closes a finished-fixture bet even if the snapshot is fresh", () => {
    expect(checkMarketPrice({ market: market({ matchStatus: "زنده" }), submittedOdds: 2, now: NOW }))
      .toEqual({ ok: false, reason: "MARKET_CLOSED" });
  });
});

describe("ticket pricing", () => {
  it("compounds server prices and rounds like the stored contract", () => {
    expect(priceTicket({ stake: 10, prices: [2, 3] })).toEqual({ ok: true, combinedOdds: 6, potentialReturn: 60 });
    expect(priceTicket({ stake: 12.5, prices: [1.5, 1.5] })).toEqual({ ok: true, combinedOdds: 2.25, potentialReturn: 28.13 });
  });

  it("rejects an out-of-range price or combination", () => {
    expect(priceTicket({ stake: 10, prices: [1_500] })).toEqual({ ok: false, reason: "ODDS_LIMIT_EXCEEDED" });
    expect(priceTicket({ stake: 10, prices: [1.1, 1] })).toEqual({ ok: false, reason: "ODDS_LIMIT_EXCEEDED" });
    expect(priceTicket({ stake: 10, prices: Array.from({ length: 20 }, () => 3) })).toEqual({ ok: false, reason: "ODDS_LIMIT_EXCEEDED" });
  });

  it("rejects a non-positive stake", () => {
    expect(priceTicket({ stake: 0, prices: [2] })).toEqual({ ok: false, reason: "INVALID_STAKE" });
    expect(priceTicket({ stake: 10, prices: [] })).toEqual({ ok: false, reason: "INVALID_STAKE" });
  });
});
