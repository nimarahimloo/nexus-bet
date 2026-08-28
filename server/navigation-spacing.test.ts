import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("navigation and spacing safeguards", () => {
  it("keeps the mobile menu controlled, dismissible, and accessible", () => {
    const shell = read("../client/src/components/PageShell.tsx");
    expect(shell).toContain('id="mobile-primary-navigation"');
    expect(shell).toContain("aria-expanded={open}");
    expect(shell).toContain("closeOnEscape");
    expect(shell).toContain("mobile-nav-backdrop");
    expect(shell).toContain("setOpen((value) => !value)");
  });

  it("enforces drawer layering and non-zero touch spacing after legacy CSS", () => {
    const css = read("../client/src/index.css");
    expect(css).toContain(".main-nav.is-open { display: grid !important; z-index: 62 !important; }");
    expect(css).toContain(".mobile-nav-backdrop { z-index: 50 !important; }");
    expect(css).toContain(".icon-button { min-width: 44px; min-height: 44px; padding: 8px !important; }");
    expect(css).toContain(".login-button { min-height: 44px; padding-inline: 16px !important; }");
    expect(css).toContain("gap: max(12px, var(--space-3, 14px))");
  });
});
