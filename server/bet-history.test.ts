import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("betting history contract", () => {
  it("uses the protected backend overview and preserves real bet fields", () => {
    const db = read("./db/bets.ts");
    const routers = read("./routers.ts");
    expect(db).toContain("export async function getUserBets");
    expect(db).toContain("selectionsJson");
    expect(db).toContain("orderBy(desc(bets.createdAt))");
    expect(routers).toContain("overview: protectedProcedure");
  });

  it("supports all, pending, won and lost filters with counts", () => {
    const account = read("../client/src/pages/SupportingPages.tsx");
    expect(account).toContain('type BetHistoryFilter = "all" | "pending" | "won" | "lost"');
    expect(account).toContain("bet-history-tabs");
    expect(account).toContain('bet.status === "pending"');
    expect(account).toContain('bet.status === "won"');
    expect(account).toContain('bet.status === "lost"');
  });

  it("renders ticket, stake, odds, return, selections and timestamp details", () => {
    const account = read("../client/src/pages/SupportingPages.tsx");
    for (const field of ["bet.ticketCode", "bet.stake", "bet.combinedOdds", "bet.potentialReturn", "bet.selections", "bet.createdAt"]) {
      expect(account).toContain(field);
    }
  });
});
