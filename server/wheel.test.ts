import { describe, expect, it } from "vitest";
import { getUtcDateKey, selectWheelReward, totalWeight, WHEEL_REWARDS } from "./wheel";

describe("lucky wheel", () => {
  it("uses a weighted server-side reward contract", () => {
    expect(totalWeight()).toBe(100);
    expect(selectWheelReward(0).code).toBe("none");
    expect(selectWheelReward(30).code).toBe("usdt_010");
    expect(selectWheelReward(65).code).toBe("usdt_025");
    expect(selectWheelReward(99).code).toBe("usdt_200");
    expect(WHEEL_REWARDS.every((reward) => reward.weight > 0)).toBe(true);
    expect(WHEEL_REWARDS.reduce((sum, reward) => sum + reward.weight, 0)).toBe(100);
  });

  it("uses a stable UTC date key for the daily limit", () => {
    expect(getUtcDateKey(new Date("2026-08-27T23:59:59.000Z"))).toBe("2026-08-27");
    expect(getUtcDateKey(new Date("2026-08-28T00:00:00.000Z"))).toBe("2026-08-28");
  });
});
