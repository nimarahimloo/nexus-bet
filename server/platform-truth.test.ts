import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("platform truth and UI consolidation", () => {
  it("keeps operational Home and Matches free from retired demo fixture seeds", () => {
    const home = read("../client/src/pages/Home.tsx");
    const matches = read("../client/src/pages/Matches.tsx");
    expect(home).not.toMatch(/demoMatchSeed|آرسنال|بارسلونا|رئال مادرید|buildDemoMatchesFromAdapter/);
    expect(matches).not.toMatch(/fallbackCards|fallbackMatches|buildDemoDetail/);
  });

  it("keeps one shared shell and one shared mobile bet sheet", () => {
    const home = read("../client/src/pages/Home.tsx");
    const matches = read("../client/src/pages/Matches.tsx");
    expect(home.match(/<PageShell\b/g) ?? []).toHaveLength(1);
    expect(matches.match(/<PageShell\b/g) ?? []).toHaveLength(1);
    expect(home.match(/<BetSheet\b/g) ?? []).toHaveLength(1);
    expect(matches.match(/<BetSheet\b/g) ?? []).toHaveLength(1);
  });

  it("does not render retired static offer, tournament, or game catalogs", () => {
    const featurePages = read("../client/src/pages/FeaturePages.tsx");
    expect(featurePages).not.toMatch(/const (offers|tournaments|games)\s*=\s*\[/);
    expect(featurePages).toContain("OperationalEmpty");
  });

  it("keeps the lucky wheel operational and backend-driven", () => {
    const featurePages = read("../client/src/pages/FeaturePages.tsx");
    const routers = read("./routers.ts");
    const db = read("./db.ts");
    expect(featurePages).toContain("trpc.rewards.spin.useMutation");
    expect(featurePages).toContain("trpc.rewards.history.useQuery");
    expect(routers).toContain("rewards: router");
    expect(routers).toContain("spinLuckyWheel");
    expect(db).toContain("rewardLedger");
  });
});
