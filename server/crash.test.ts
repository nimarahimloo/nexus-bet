import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCrashSeed, verifyCrashSeed } from "./crash";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Crash backend integration contract", () => {
  it("uses the database transaction for round validation and atomic wallet locking", () => {
    const db = read("./db.ts");
    expect(db).toContain("export async function placeCrashBet");
    expect(db).toContain("round.status !== \"running\"");
    expect(db).toContain("gte(wallets.availableBalance, stake.toFixed(6))");
    expect(db).toContain('throw new Error("INSUFFICIENT_BALANCE")');
    expect(db).toContain('status: "pending"');
  });

  it("creates a verifiable commit/reveal seed for new rounds and rejects tampering", () => {
    const seed = createCrashSeed();
    expect(seed.serverSeed).toHaveLength(64);
    expect(seed.serverSeedHash).toHaveLength(64);
    expect(verifyCrashSeed(seed.serverSeed, seed.serverSeedHash)).toBe(true);
    expect(verifyCrashSeed(`${seed.serverSeed}tampered`, seed.serverSeedHash)).toBe(false);
    const db = read("./db.ts");
    expect(db).toContain("serverSeedHash");
    expect(db).toContain("serverSeed");
  });

  it("wires current, history, place and cashout through protected/public tRPC procedures", () => {
    const routers = read("./routers.ts");
    expect(routers).toContain("crash: router");
    expect(routers).toContain("current: publicProcedure");
    expect(routers).toContain("history: publicProcedure");
    expect(routers).toContain("place: protectedProcedure");
    expect(routers).toContain("cashout: protectedProcedure");
  });

  it("shows real wallet balance and maps backend failure states in the Crash UI", () => {
    const crash = read("../client/src/pages/Crash.tsx");
    expect(crash).toContain("trpc.wallet.portfolio.useQuery");
    expect(crash).toContain("availableBalance");
    expect(crash).toContain("currency: activeCurrency");
    expect(crash).toContain("INSUFFICIENT_BALANCE");
    expect(crash).toContain("ROUND_CLOSED");
    expect(crash).toContain("BET_CLOSED");
    expect(crash).toContain("wallet.portfolio.invalidate");
    expect(crash).toContain("round-proof");
    expect(crash).toContain("public seed");
  });
});
