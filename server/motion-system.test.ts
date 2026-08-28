import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Nexus live motion system", () => {
  it("uses Framer Motion for route-level entry without forcing motion preferences", () => {
    const shell = read("../client/src/components/PageShell.tsx");
    expect(shell).toContain('from "framer-motion"');
    expect(shell).toContain("useReducedMotion");
    expect(shell).toContain("<motion.main");
    expect(shell).toContain("<motion.section");
  });

  it("covers product-specific animation cues while honoring reduced motion", () => {
    const css = read("../client/src/index.css");
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("nexus-live-card");
    expect(css).toContain("nexus-selection-pop");
    expect(css).toContain("nexus-wheel-core");
    expect(css).toContain("nexus-crash-scan");
    expect(css).toContain("nexus-support-beacon");
    expect(css).toContain("nexus-drawer-arrive");
  });
});
