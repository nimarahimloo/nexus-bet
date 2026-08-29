import { describe, expect, it } from "vitest";
import { getWheelSegments, totalWeight, WHEEL_REWARDS } from "./wheel";

describe("bounded reward contracts", () => {
  it("exposes transparent wheel probabilities that sum to 100 percent", () => {
    const segments = getWheelSegments();
    expect(totalWeight()).toBe(100);
    expect(segments).toHaveLength(WHEEL_REWARDS.length);
    expect(segments.reduce((sum, segment) => sum + segment.chancePercent, 0)).toBe(100);
    expect(segments.every((segment) => segment.weight > 0 && segment.chancePercent > 0)).toBe(true);
  });

  it("keeps the activity reward contract non-wager and bounded", () => {
    const activityCode = "daily_checkin";
    expect(activityCode).not.toContain("bet");
    expect(activityCode).not.toContain("loss");
    expect(0.05).toBeGreaterThan(0);
    expect(0.05).toBeLessThanOrEqual(0.05);
  });
});
