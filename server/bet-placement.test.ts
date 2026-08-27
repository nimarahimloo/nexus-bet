import { describe, expect, it } from "vitest";
import { placeBet } from "./db";

const selection = { id: "fixture-1-1", match: "آرسنال — چلسی", market: "برد مستقیم", odds: 2.1 };

describe("bet placement contract", () => {
  it("rejects an invalid stake before touching the database", async () => {
    await expect(placeBet({ userId: 1, stake: 0, combinedOdds: 2.1, potentialReturn: 0, selections: [selection] })).rejects.toThrow("INVALID_STAKE");
  });

  it("rejects empty selections before touching the database", async () => {
    await expect(placeBet({ userId: 1, stake: 10, combinedOdds: 2.1, potentialReturn: 21, selections: [] })).rejects.toThrow("EMPTY_SELECTIONS");
  });

  it("rejects invalid odds before touching the database", async () => {
    await expect(placeBet({ userId: 1, stake: 10, combinedOdds: 0, potentialReturn: 0, selections: [selection] })).rejects.toThrow("INVALID_ODDS");
  });
});
