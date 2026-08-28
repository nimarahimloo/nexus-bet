import { describe, expect, it } from "vitest";
import { formatFaDecimal, formatFaNumber, formatFaTime } from "../shared/format";
import { appRoutePaths } from "../shared/routes";
import { formatCrashAmount, formatCrashCashoutLabel, formatCrashStakeLabel, formatMatchKickoff, formatMatchOdds } from "../shared/sportsDisplay";
import { pageShellDisplayContract } from "../client/src/components/PageShell";

describe("Nexus Bet UI contracts", () => {
  it("formats decimals with Persian digits and normalized precision", () => {
    expect(formatFaDecimal(1284.75)).toBe("۱٬۲۸۴٫۷۵");
    expect(formatFaNumber(67, { maximumFractionDigits: 0 })).toBe("۶۷");
    expect(formatFaTime(22, 30)).toBe("۲۲:۳۰");
  });

  it("formats derived displays used by Matches and Crash with Persian digits", () => {
    expect(formatMatchKickoff(20, 0)).toBe("۲۰:۰۰");
    expect(formatMatchOdds(2.04)).toBe("۲٫۰۴");
    expect(formatCrashAmount(10)).toBe("۱۰٫۰۰"); // Crash stake
    expect(formatCrashAmount(14.2)).toBe("۱۴٫۲۰"); // Crash cashout
    expect(formatCrashStakeLabel(10)).toBe("۱۰٫۰۰ USDT");
    expect(formatCrashCashoutLabel(14.2)).toBe("۱۴٫۲۰ USDT");
    expect(pageShellDisplayContract.numericFields).toEqual([]);
  });

  it("validates SPORTS_API_KEY against API-Football timezone endpoint when configured", async () => {
    if (!process.env.SPORTS_API_KEY) return;
    const response = await fetch("https://v3.football.api-sports.io/timezone", {
      headers: { "x-apisports-key": process.env.SPORTS_API_KEY },
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { errors?: unknown };
    expect(payload).toHaveProperty("errors");
    expect(["object", "undefined"]).toContain(typeof payload.errors);
  }, 12_000);

  it("keeps every independent product route in the shared route contract", () => {
    expect(appRoutePaths).toEqual(["/", "/matches", "/wallet", "/ai", "/vip", "/account", "/crash", "/promotions", "/tournaments", "/rewards", "/casino"]);
  });
});
