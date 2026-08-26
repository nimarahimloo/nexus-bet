import { describe, expect, it } from "vitest";
import { calculatePotentialReturn, combinedOdds, isValidUsdtStake } from "../client/src/lib/betting";

describe("Nexus Bet betting calculations", () => {
  it("calculates combined odds and potential USDT return", () => {
    const odds = combinedOdds([{ odds: 1.85 }, { odds: 2.1 }]);
    expect(odds).toBe(3.89);
    const totalReturn = calculatePotentialReturn(25, odds);
    expect(totalReturn).toBe(97.25);
    expect(Number((totalReturn - 25).toFixed(2))).toBe(72.25);
  });

  it("accepts stakes in the valid USDT balance range only", () => {
    expect(isValidUsdtStake(1, 1284.75)).toBe(true);
    expect(isValidUsdtStake(1284.76, 1284.75)).toBe(false);
    expect(isValidUsdtStake(0.99, 1284.75)).toBe(false);
  });
});
