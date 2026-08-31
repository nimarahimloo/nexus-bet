import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

  it("keeps the Rewards UI focused on the primary action", () => {
    const page = readFileSync(new URL("../client/src/pages/FeaturePages.tsx", import.meta.url), "utf8");
    expect(page).toContain("شانس روزانه");
    expect(page).toContain("پاداش فعالیت");
    expect(page).toContain("segmentsQuery.isLoading");
    expect(page).toContain("گردونه موقتاً در دسترس نیست.");
    expect(page).toContain("تلاش دوباره");
    expect(page).toContain("نتیجه در backend؛ پاداش مستقیماً به wallet.");
    expect(page).not.toContain("شانس را به موجودی واقعی وصل کن");
    expect(page).not.toContain("پیشنهاد معتبر، نه کارت تزئینی");
    expect(page).not.toContain("کتابخانهٔ بازی از catalog واقعی");
    expect(page).not.toContain("هر کمپین باید از backend، با شرایط و مهلت معتبر منتشر شود.");
  });

  it("uses a stable UTC date key for the daily limit", () => {
    expect(getUtcDateKey(new Date("2026-08-27T23:59:59.000Z"))).toBe("2026-08-27");
    expect(getUtcDateKey(new Date("2026-08-28T00:00:00.000Z"))).toBe("2026-08-28");
  });
});
