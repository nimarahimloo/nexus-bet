import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("real data migration audit", () => {
  it("keeps Crash data and actions backend-driven", () => {
    const crash = read("../client/src/pages/Crash.tsx");
    expect(crash).toContain("trpc.crash.current.useQuery");
    expect(crash).toContain("trpc.crash.place.useMutation");
    expect(crash).toContain("trpc.crash.cashout.useMutation");
    expect(crash).not.toMatch(/\["۱٫۲۱×"|multiplier = 1\.42|setInterval/);
  });

  it("keeps secondary pages on backend procedures rather than static catalogs", () => {
    const features = read("../client/src/pages/FeaturePages.tsx");
    const supporting = read("../client/src/pages/SupportingPages.tsx");
    const wallet = read("../client/src/components/MultiAssetWallet.tsx");
    const routers = read("./routers.ts");
    expect(features).toContain("trpc.promotions.active.useQuery");
    expect(features).toContain("trpc.tournaments.active.useQuery");
    expect(features).toContain("trpc.games.catalog.useQuery");
    expect(supporting).toContain("trpc.vip.summary.useQuery");
    expect(wallet).toContain("trpc.wallet.transactions.useQuery");
    expect(wallet).toContain("trpc.wallet.portfolio.useQuery");
    expect(wallet).toContain("trpc.assets.active.useQuery");
    expect(supporting).toContain("trpc.account.overview.useQuery");
    expect(features).not.toMatch(/const (offers|tournaments|games)\s*=\s*\[/);
    expect(routers).not.toContain("fallbackSmartPicks");
  });
});
