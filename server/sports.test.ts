import { describe, expect, it } from "vitest";
import { buildDemoMatchesFromAdapter, mapSportsFixture, mapSportsFixtures } from "../shared/sports";

describe("sports fixture mapper", () => {
  it("maps a real fixture shape into a match card", () => {
    const result = mapSportsFixture({
      fixture: { id: 123, date: "2026-08-27T18:30:00+00:00", status: { short: "NS", elapsed: null } },
      league: { name: "Premier League" },
      teams: {
        home: { name: "Arsenal", logo: "https://example.com/arsenal.png" },
        away: { name: "Chelsea", logo: "https://example.com/chelsea.png" },
      },
      goals: { home: null, away: null },
    });
    expect(result).toMatchObject({ id: "123", league: "Premier League", status: "امروز", home: "Arsenal", away: "Chelsea" });
  });

  it("builds the Home demo feed through the shared adapter contract", () => {
    const result = buildDemoMatchesFromAdapter([{
      id: "seed",
      league: "لالیگا",
      sport: "فوتبال",
      status: "نمونه",
      time: "۲۲:۳۰",
      home: "رئال مادرید",
      homeLogo: "real.png",
      away: "بارسلونا",
      awayLogo: "barca.png",
      markets: [{ label: "۱", name: "برد میزبان", odds: 2 }],
      insight: "نمونه",
    }]);
    expect(result[0]).toMatchObject({ id: "seed", markets: [{ label: "۱" }], insight: "نمونه", homeLogo: "real.png" });
  });

  it("keeps live status, minute, score, and filters malformed fixtures", () => {
    const results = mapSportsFixtures([
      { fixture: { id: 1, date: "2026-08-27T18:30:00Z", status: { short: "2H", elapsed: 67 } }, teams: { home: { name: "A" }, away: { name: "B" } }, goals: { home: 1, away: 1 } },
      { fixture: { id: 2 }, teams: { home: { name: "Only home" } } },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ status: "زنده", minute: "۶۷′", score: "1 — 1" });
  });
});
