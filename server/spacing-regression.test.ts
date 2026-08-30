import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("spacing and mobile layout contract", () => {
  it("defines shared spacing tokens and non-zero page rhythm", () => {
    const css = read("../client/src/index.css");
    expect(css).toContain("--space-section");
    expect(css).toContain("--space-card");
    expect(css).toContain(".subpage-content, .nexus-shell .home-shell > .container");
    expect(css).toContain("gap: 28px");
  });

  it("protects mobile layouts from collapsed controls and overflow", () => {
    const css = read("../client/src/index.css");
    expect(css).toContain("width: calc(100% - 28px)");
    expect(css).toContain("min-height: 40px");
    expect(css).toContain("overflow-x: hidden");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("padding: var(--space-3) var(--space-5)");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(css).toContain("overflow: visible");
  });

  it("keeps the shared shell as the owner of page-level spacing", () => {
    const shell = read("../client/src/components/PageShell.tsx");
    expect(shell).toContain("className={`${isHome ? \"\" : \"subpage-content\"} container`}");
  });
});
