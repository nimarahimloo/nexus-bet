import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("iOS-inspired mobile redesign", () => {
  it("loads the uploaded Kalameh font weights and applies them globally", () => {
    const css = read("../client/src/ios26.css");
    const indexCss = read("../client/src/index.css");
    expect(indexCss).toContain('@import "./ios26.css"');
    expect(css).toContain("KalamehWebFaNum-Regular_d2e47802.woff2");
    expect(css).toContain("KalamehWebFaNum-Black_53c00ed8.woff2");
    expect(css).toContain('font-family: "Nexus Kalameh"');
    expect(css).toContain("letter-spacing: normal");
  });

  it("keeps the reference-led shell minimal with one secondary drawer and explicit trust cues", () => {
    const shell = read("../client/src/components/PageShell.tsx");
    const featurePages = read("../client/src/pages/FeaturePages.tsx");
    const css = read("../client/src/index.css");
    expect(shell).toContain('className="more-nav-drawer glass-panel"');
    expect(shell).toContain('className="trust-bar container"');
    expect(featurePages).toContain('title: "مسابقات زنده"');
    expect(featurePages).toContain('title: "کیف پول USDT"');
    expect(css).toContain("grid-template-columns: repeat(6, minmax(0, 1fr))");
    expect(css).toContain(".more-nav-drawer");
  });

  it("keeps a touch-first shell with glass material, safe area and focused mobile route hierarchy", () => {
    const css = read("../client/src/ios26.css");
    expect(css).toContain("backdrop-filter: blur(30px)");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain(".feature-hub-grid");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain(".mobile-bottom-nav");
  });
});
