import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { toggleSelection } from "../client/src/lib/betting";

describe("Nexus AI smart picks", () => {
  it("exposes a match-scoped insight contract with non-guaranteed signals", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const matches = readFileSync(new URL("../client/src/pages/Matches.tsx", import.meta.url), "utf8");
    expect(router).toContain("matchInsight: publicProcedure");
    expect(router).toContain("nexus_match_insight");
    expect(router).toContain("نتیجه یا سود را تضمین نکن");
    expect(matches).toContain("trpc.ai.matchInsight.useQuery");
    expect(matches).toContain("تحلیل این مسابقه");
  });

  it("adds an AI pick once and removes it when toggled again", () => {
    const pick = { id: "live-match-۱", odds: 2.04 };
    const added = toggleSelection([], pick);
    expect(added).toEqual({ items: [pick], added: true });
    expect(toggleSelection(added.items, pick)).toEqual({ items: [], added: false });
  });
});
