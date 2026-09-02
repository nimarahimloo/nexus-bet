import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("multi-sport feed contracts", () => {
  it("covers the provider sports directory and real identity fields", () => {
    const feed = read("./multiSportsFeed.ts");
    const sports = read("../shared/sports.ts");
    const routers = read("./routers.ts");
    expect(feed).toContain("SPORTS_DIRECTORY");
    expect(feed).toContain("basketball");
    expect(feed).toContain("volleyball");
    expect(feed).toContain("x-apisports-key");
    expect(feed).toContain("home.logo");
    expect(feed).toContain("away.logo");
    expect(feed).toContain("return []");
    expect(feed).toContain("previewMatches.slice");
    expect(feed).toContain("source: \"preview\"");
    expect(sports).toContain("homeLogo");
    expect(sports).toContain("awayLogo");
    const matches = read("../client/src/pages/Matches.tsx");
    expect(matches).toContain("match.homeLogo ? <img src={match.homeLogo}");
    expect(matches).toContain("match.awayLogo ? <img src={match.awayLogo}");
    expect(matches).toContain('sportsQuery.data?.source !== "preview"');
    expect(routers).toContain("directory: publicProcedure");
    expect(routers).toContain("fetchSportsUniverse");
    expect(routers).toContain("max(30).default(10)");
  });
});
