import { describe, expect, it } from "vitest";
import { filterSportsMatches, mapSportsFixture, mapSportsFixtures } from "../shared/sports";

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


  it("filters by sport and live status without changing the source matches", () => {
    const matches = [
      { id: "1", sport: "فوتبال", status: "زنده", league: "A", time: "", home: "A", homeLogo: "", away: "B", awayLogo: "", markets: [], insight: "" },
      { id: "2", sport: "فوتبال", status: "امروز", league: "B", time: "", home: "C", homeLogo: "", away: "D", awayLogo: "", markets: [], insight: "" },
      { id: "3", sport: "بسکتبال", status: "زنده", league: "C", time: "", home: "E", homeLogo: "", away: "F", awayLogo: "", markets: [], insight: "" },
    ] as const;
    expect(filterSportsMatches([...matches], { sport: "فوتبال" }).map((match) => match.id)).toEqual(["1", "2"]);
    expect(filterSportsMatches([...matches], { sport: "همه", liveOnly: true }).map((match) => match.id)).toEqual(["1", "3"]);
    expect(filterSportsMatches([...matches], { sport: "بسکتبال", liveOnly: true }).map((match) => match.id)).toEqual(["3"]);
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
