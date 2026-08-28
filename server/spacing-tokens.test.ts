import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("standard spacing token contract", () => {
  it("defines a complete 4px-based scale and semantic aliases", () => {
    const css = read("../client/src/index.css");
    for (const token of ["--space-0", "--space-1", "--space-2", "--space-3", "--space-4", "--space-6", "--space-8", "--space-12", "--space-15"]) {
      expect(css).toContain(`${token}:`);
    }
    for (const token of ["--space-page-inline", "--space-page-block", "--space-section", "--space-card", "--space-control", "--space-stack"]) {
      expect(css).toContain(`${token}:`);
    }
  });

  it("provides reusable spacing primitives and a mobile scale", () => {
    const css = read("../client/src/index.css");
    for (const utility of [".space-stack", ".space-stack-compact", ".space-inline", ".space-section", ".space-page", ".space-card"]) {
      expect(css).toContain(utility);
    }
    expect(css).toContain("@media (max-width: 720px)");
    expect(css).toContain("--space-page-inline: var(--space-4)");
  });

  it("documents token usage for future feature work", () => {
    const docs = read("../docs/spacing-system.md");
    expect(docs).toContain("Tokenهای semantic");
    expect(docs).toContain("عدد خام");
    expect(docs).toContain("۳۲۰");
  });
});
