import { describe, expect, it } from "vitest";
import {
  fixtureIdFromSelectionId,
  isSettleableFixtureId,
  outcomeSide,
  round6,
  selectionCode,
  selectionOutcome,
  settleBetOutcome,
  settlementMoney,
  type FixtureResult,
  type SettleableSelection,
} from "./settlement";
import { mapApiFootballFixture, stateFromApiStatus, unknownFixtureResult } from "./fixtureResults";
import { parseSelections } from "./db/settlement";

const selection = (id: string, market: string, odds = 2): SettleableSelection => ({
  id,
  market,
  match: "آرسنال — چلسی",
  odds,
});

const finished = (fixtureId: string, homeGoals: number, awayGoals: number): FixtureResult => ({
  fixtureId,
  state: "finished",
  homeGoals,
  awayGoals,
  error: null,
});

describe("selection identity", () => {
  it("splits a fixture id from the outcome label even when the id contains dashes", () => {
    expect(fixtureIdFromSelectionId("1234567-۲")).toBe("1234567");
    expect(fixtureIdFromSelectionId("preview-1-۱")).toBe("preview-1");
    expect(selectionCode("1234567-۲")).toBe("۲");
  });

  it("never treats seeded preview events as settleable", () => {
    expect(isSettleableFixtureId("1234567")).toBe(true);
    expect(isSettleableFixtureId("preview-1")).toBe(false);
    expect(isSettleableFixtureId("demo-9")).toBe(false);
    expect(isSettleableFixtureId("")).toBe(false);
  });

  it("reads the side from the id label, then from the Persian market name", () => {
    expect(outcomeSide(selection("1-۱", "برد میزبان"))).toBe("home");
    expect(outcomeSide(selection("1-X", "مساوی"))).toBe("draw");
    expect(outcomeSide(selection("1-2", "برد مهمان"))).toBe("away");
    expect(outcomeSide(selection("1-unknown", "برد میزبان"))).toBe("home");
    expect(outcomeSide(selection("1-unknown", "تعداد گل"))).toBeNull();
  });
});

describe("per-selection outcome", () => {
  it("settles a home win correctly for all three sides", () => {
    const result = finished("1234567", 2, 1);
    expect(selectionOutcome(selection("1234567-۱", "برد میزبان"), result)).toBe("won");
    expect(selectionOutcome(selection("1234567-X", "مساوی"), result)).toBe("lost");
    expect(selectionOutcome(selection("1234567-۲", "برد مهمان"), result)).toBe("lost");
  });

  it("settles a draw correctly", () => {
    const result = finished("1234567", 0, 0);
    expect(selectionOutcome(selection("1234567-X", "مساوی"), result)).toBe("won");
    expect(selectionOutcome(selection("1234567-۱", "برد میزبان"), result)).toBe("lost");
  });

  it("leaves live, scheduled and unreadable fixtures pending", () => {
    expect(selectionOutcome(selection("1-۱", "برد میزبان"), { fixtureId: "1", state: "live", homeGoals: 1, awayGoals: 0 })).toBe("pending");
    expect(selectionOutcome(selection("1-۱", "برد میزبان"), { fixtureId: "1", state: "scheduled", homeGoals: null, awayGoals: null })).toBe("pending");
    expect(selectionOutcome(selection("1-۱", "برد میزبان"), unknownFixtureResult("1", "SPORTS_API_500"))).toBe("pending");
    expect(selectionOutcome(selection("1-۱", "برد میزبان"), undefined)).toBe("pending");
  });

  it("does not settle a finished fixture that has no score", () => {
    expect(selectionOutcome(selection("1-۱", "برد میزبان"), { fixtureId: "1", state: "finished", homeGoals: null, awayGoals: null })).toBe("pending");
  });

  it("refunds void fixtures and refuses preview fixtures", () => {
    expect(selectionOutcome(selection("1-۱", "برد میزبان"), { fixtureId: "1", state: "void", homeGoals: null, awayGoals: null })).toBe("void");
    expect(selectionOutcome(selection("preview-1-۱", "برد میزبان"), finished("preview-1", 3, 0))).toBe("pending");
  });

  it("keeps unknown markets pending instead of guessing", () => {
    expect(selectionOutcome(selection("1234567-unknown", "تعداد گل"), finished("1234567", 2, 1))).toBe("pending");
  });
});

describe("ticket outcome for accumulators", () => {
  const lost = finished("222", 0, 1);
  const wonHome = finished("111", 2, 0);
  const results = new Map<string, FixtureResult>([["111", wonHome], ["222", lost], ["333", wonHome]]);

  it("wins only when every leg won", () => {
    expect(settleBetOutcome([selection("111-۱", "برد میزبان"), selection("333-۱", "برد میزبان")], results)).toBe("won");
  });

  it("loses the whole ticket when one leg lost", () => {
    expect(settleBetOutcome([selection("111-۱", "برد میزبان"), selection("222-۱", "برد میزبان")], results)).toBe("lost");
  });

  it("refunds the whole ticket when a leg is void and nothing lost", () => {
    const withVoid = new Map(results);
    withVoid.set("444", { fixtureId: "444", state: "void", homeGoals: null, awayGoals: null });
    expect(settleBetOutcome([selection("111-۱", "برد میزبان"), selection("444-۱", "برد میزبان")], withVoid)).toBe("void");
  });

  it("stays pending while any leg is unresolved", () => {
    expect(settleBetOutcome([selection("111-۱", "برد میزبان"), selection("999-۱", "برد میزبان")], results)).toBe("pending");
  });

  it("stays pending with no selections", () => {
    expect(settleBetOutcome([], results)).toBe("pending");
  });
});

describe("ledger arithmetic", () => {
  it("pays the recorded potential return on a win and releases the stake", () => {
    expect(settlementMoney("won", 10, 21.5)).toEqual({ availableDelta: 21.5, lockedDelta: -10, ledgerAmount: 21.5 });
  });

  it("consumes the locked stake on a loss without paying anything", () => {
    expect(settlementMoney("lost", 10, 21.5)).toEqual({ availableDelta: 0, lockedDelta: -10, ledgerAmount: 0 });
  });

  it("refunds exactly the stake on a void", () => {
    expect(settlementMoney("void", 10, 21.5)).toEqual({ availableDelta: 10, lockedDelta: -10, ledgerAmount: 10 });
  });

  it("keeps six-decimal precision", () => {
    expect(round6(0.1 + 0.2)).toBe(0.3);
    expect(settlementMoney("won", 3.0000001, 7.12345678).ledgerAmount).toBe(7.123457);
  });
});

describe("provider status mapping", () => {
  it("maps API-Football statuses onto settlement states", () => {
    expect(stateFromApiStatus("FT")).toBe("finished");
    expect(stateFromApiStatus("AET")).toBe("finished");
    expect(stateFromApiStatus("2H")).toBe("live");
    expect(stateFromApiStatus("NS")).toBe("scheduled");
    expect(stateFromApiStatus("PST")).toBe("void");
    expect(stateFromApiStatus("SUSP")).toBe("unknown");
    expect(stateFromApiStatus(undefined)).toBe("unknown");
  });

  it("reads final goals from a provider payload", () => {
    const result = mapApiFootballFixture("1234567", {
      response: [{ fixture: { id: 1234567, status: { short: "FT" } }, goals: { home: 2, away: 1 } }],
    });
    expect(result).toMatchObject({ fixtureId: "1234567", state: "finished", homeGoals: 2, awayGoals: 1, error: null });
  });

  it("reports a missing fixture instead of inventing a 0-0", () => {
    const result = mapApiFootballFixture("1234567", { response: [] });
    expect(result.state).toBe("unknown");
    expect(result.homeGoals).toBeNull();
    expect(result.error).toBe("FIXTURE_NOT_FOUND");
  });
});

describe("stored selection parsing", () => {
  it("tolerates legacy and broken rows without throwing", () => {
    expect(parseSelections("not json")).toEqual([]);
    expect(parseSelections(JSON.stringify({ id: "1-۱" }))).toEqual([]);
    expect(parseSelections(JSON.stringify([
      { id: "1-۱", market: "برد میزبان", match: "A — B", odds: 2 },
      { id: 42 },
      null,
    ]))).toEqual([{ id: "1-۱", market: "برد میزبان", match: "A — B", odds: 2 }]);
  });
});

describe("cron worker guard", () => {
  it("rejects an unauthenticated caller with 403 and never reaches settlement", async () => {
    const { runSportsSettlement } = await import("./settlementWorker");
    const calls: { statusCode?: number; body?: unknown } = {};
    const res = {
      status(code: number) { calls.statusCode = code; return this; },
      json(body: unknown) { calls.body = body; return this; },
    };
    await runSportsSettlement({ headers: {}, query: {} } as never, res as never);
    expect(calls.statusCode).toBe(403);
    expect(calls.body).toEqual({ error: "CRON_AUTH_REQUIRED" });
  });
});
