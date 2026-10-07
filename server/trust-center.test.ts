import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "client/src/pages/TrustCenter.tsx"), "utf8");
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const shell = readFileSync(resolve(root, "client/src/components/PageShell.tsx"), "utf8");

describe("Trust Center contracts", () => {
  it("uses real provider readiness and states disabled-safe boundaries", () => {
    expect(page).toContain("trpc.wallet.providerStatus.useQuery");
    expect(page).toContain("provider?.enabled");
    expect(page).toContain("disabled-safe");
    expect(page).toContain("بدون پرداخت واقعی");
    expect(page).toContain("بدون provider ساختگی");
  });

  it("is reachable from the app route and shared navigation", () => {
    expect(app).toContain('path="/trust"');
    expect(app).toContain("TrustCenterPage");
    expect(shell).toContain('["/trust", "مرکز اعتماد", ShieldCheck]');
  });
});
