import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pageShell = readFileSync(resolve(root, "client/src/components/PageShell.tsx"), "utf8");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");

describe("Nexus Bet brand and responsive contracts", () => {
  it("keeps the same branded identity in header and footer", () => {
    expect(pageShell).toContain("NEXUS");
    expect(pageShell).toContain("TRUSTED PLAY");
    expect(pageShell).toContain("nexus-bet-logo_92fe8c09.png");
    expect(home).toContain("className=\"footer-brand\"");
    expect(home).toContain("تجربهٔ شفاف پیش‌بینی ورزشی");
  });

  it("defines desktop, tablet and mobile responsive contracts", () => {
    expect(css).toContain("@media (min-width: 1440px)");
    expect(css).toContain("@media (max-width: 980px) and (min-width: 721px)");
    expect(css).toContain("@media (max-width: 720px)");
    expect(css).toContain("@media (max-width: 390px)");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("--nexus-content-max: 1240px");
  });
});
