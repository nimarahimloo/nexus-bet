import { describe, expect, it } from "vitest";
import { placeBet } from "./db";

const selection = { id: "1234567-1", match: "آرسنال — چلسی", market: "برد میزبان", odds: 2.1 };

describe("bet placement guards", () => {
  it("rejects an invalid stake before touching the database", async () => {
    await expect(placeBet({ userId: 1, stake: 0, selections: [selection] })).rejects.toThrow("INVALID_STAKE");
  });

  it("rejects empty selections before touching the database", async () => {
    await expect(placeBet({ userId: 1, stake: 10, selections: [] })).rejects.toThrow("EMPTY_SELECTIONS");
  });

  it("rejects a ticket with too many legs", async () => {
    const legs = Array.from({ length: 21 }, (_, index) => ({ ...selection, id: `123456${index}-1` }));
    await expect(placeBet({ userId: 1, stake: 10, selections: legs })).rejects.toThrow("TOO_MANY_SELECTIONS");
  });

  it("refuses preview fixtures so seeded demo data can never be bet on", async () => {
    await expect(placeBet({
      userId: 1,
      stake: 10,
      selections: [{ id: "preview-1-1", match: "نکسوس — ویولت", market: "برد میزبان", odds: 2 }],
    })).rejects.toThrow("MARKET_UNAVAILABLE");
  });

  it("refuses markets it cannot price", async () => {
    await expect(placeBet({
      userId: 1,
      stake: 10,
      selections: [{ id: "1234567-unknown", match: "آرسنال — چلسی", market: "تعداد گل", odds: 2 }],
    })).rejects.toThrow("MARKET_UNAVAILABLE");
  });
});
