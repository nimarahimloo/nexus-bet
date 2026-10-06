import { describe, expect, it } from "vitest";
import { calculateStakeSuggestion, normalizeRiskProfile } from "./stakeAssistant";

describe("Smart Stake Assistant", () => {
  it("keeps suggestions bounded by the real available bankroll and profile cap", () => {
    const suggestion = calculateStakeSuggestion({ availableBalance: 1_000, lockedBalance: 250, combinedOdds: 2.4, profile: "balanced" });
    expect(suggestion.suggestedStake).toBe(10);
    expect(suggestion.maxStake).toBe(20);
    expect(suggestion.potentialReturn).toBe(24);
    expect(suggestion.guaranteed).toBe(false);
  });

  it("does not suggest money when the wallet has no available balance", () => {
    const suggestion = calculateStakeSuggestion({ availableBalance: 0, lockedBalance: 50, combinedOdds: 3, profile: "assertive" });
    expect(suggestion.suggestedStake).toBe(0);
    expect(suggestion.maxStake).toBe(0);
    expect(suggestion.potentialReturn).toBe(0);
  });

  it("normalizes unknown persisted values to the safe balanced profile", () => {
    expect(normalizeRiskProfile("unknown")).toBe("balanced");
    expect(normalizeRiskProfile("conservative")).toBe("conservative");
  });
});
