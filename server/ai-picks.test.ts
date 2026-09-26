import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { toggleSelection } from "../client/src/lib/betting";
import { rankSmartPicks } from "./aiPicks";

describe("Nexus AI smart picks", () => {
  it("exposes a match-scoped insight contract with non-guaranteed signals", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const matches = readFileSync(new URL("../client/src/pages/Matches.tsx", import.meta.url), "utf8");
    expect(router).toContain("matchInsight: publicProcedure");
    expect(router).toContain("nexus_match_insight");
    expect(router).toContain("نتیجه یا سود را تضمین نکن");
    expect(router).toContain("smartPicks: publicProcedure");
    expect(matches).toContain("trpc.ai.matchInsight.useQuery");
    expect(matches).toContain("تحلیل این مسابقه");
  });

  it("ranks feed candidates deterministically without inventing odds", () => {
    const { picks, source } = rankSmartPicks([
      { eventId: "1", league: "A", match: "H — A", sport: "فوتبال", marketLabel: "1", marketName: "میزبان", odds: 1.9, status: "امروز", popularity: 80 },
      { eventId: "2", league: "B", match: "X — Y", sport: "تنیس", marketLabel: "2", marketName: "میهمان", odds: 4.2, status: "فردا", popularity: 40 },
    ]);
    expect(source).toBe("ai");
    expect(picks.length).toBe(2);
    expect(picks[0].odds).toBe(1.9);
    expect(["کم", "متوسط", "بالا"]).toContain(picks[0].risk);
    expect(picks[0].rationale.length).toBeGreaterThan(20);
  });

  it("adds an AI pick once and removes it when toggled again", () => {
    const pick = { id: "live-match-۱", odds: 2.04 };
    const added = toggleSelection([], pick);
    expect(added).toEqual({ items: [pick], added: true });
    expect(toggleSelection(added.items, pick)).toEqual({ items: [], added: false });
  });
});
