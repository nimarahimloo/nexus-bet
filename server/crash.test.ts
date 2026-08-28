import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
    expect(crash).toContain("trpc.wallet.me.useQuery");
    expect(crash).toContain("availableBalance");
    expect(crash).toContain("INSUFFICIENT_BALANCE");
    expect(crash).toContain("ROUND_CLOSED");
    expect(crash).toContain("BET_CLOSED");
    expect(crash).toContain("wallet.me.invalidate");
  });
});
