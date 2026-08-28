import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("hero asset and font recovery", () => {
  it("assigns unique route hero assets for promotions, tournaments, rewards, casino and account", () => {
    const features = read("../client/src/pages/FeaturePages.tsx");
    const supporting = read("../client/src/pages/SupportingPages.tsx");
    expect(features).toContain("nexus-bet-promotions-hero-v3_65559fc7.png");
    expect(features).toContain("nexus-bet-tournaments-hero-v3_d13dd980.png");
    expect(features).toContain("nexus-bet-rewards-hero-v3_92731f27.png");
    expect(features).toContain("nexus-bet-casino-hero-v3_e26e607d.png");
    expect(supporting).toContain("nexus-bet-account-hero-v2_f471d0ea.png");
  });

  it("keeps image overlays readable yet bright and prevents font fallback in the product shell", () => {
    const css = read("../client/src/index.css");
    expect(css).toContain(".subpage-art img { opacity: .9 !important; filter: brightness(1.12) saturate(1.05); }");
    expect(css).toContain(".art-overlay { background: rgba(8, 6, 14, .06) !important; opacity: 1 !important; }");
    expect(css).toContain(".nexus-shell, .nexus-shell *");
    expect(css).toContain("font-family: var(--font-body) !important");
  });
});
