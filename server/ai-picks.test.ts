import { describe, expect, it } from "vitest";
import { fallbackSmartPicks, type AiCandidate } from "../shared/ai";
import { toggleSelection } from "../client/src/lib/betting";

const candidates: AiCandidate[] = [
  {
    eventId: "live-match",
    league: "لیگ برتر",
    match: "آرسنال — چلسی",
    sport: "فوتبال",
    marketLabel: "۱",
    marketName: "برد آرسنال",
    odds: 2.04,
    status: "زنده",
    popularity: 94,
  },
  {
    eventId: "long-shot",
    league: "بوندس‌لیگا",
    match: "بایرن — دورتموند",
    sport: "فوتبال",
    marketLabel: "۲",
    marketName: "برد دورتموند",
    odds: 4.75,
    status: "فردا",
    popularity: 65,
  },
];

describe("Nexus AI smart picks", () => {
  it("returns explainable picks with risk and confidence", () => {
    const picks = fallbackSmartPicks(candidates);
    expect(picks).toHaveLength(2);
    expect(picks[0]).toMatchObject({ eventId: "live-match", risk: "کم" });
    expect(picks[0]?.tags).toContain("محبوب");
    expect(picks[0]?.rationale).toContain("محبوبیت");
  });

  it("does not invent a pick without a positive odds value", () => {
    expect(fallbackSmartPicks([{ ...candidates[0], odds: 0 }])).toHaveLength(0);
  });

  it("adds an AI pick once and removes it when toggled again", () => {
    const pick = { id: "live-match-۱", odds: 2.04 };
    const added = toggleSelection([], pick);
    expect(added).toEqual({ items: [pick], added: true });
    expect(toggleSelection(added.items, pick)).toEqual({ items: [], added: false });
  });
});
