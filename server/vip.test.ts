import { describe, expect, it } from "vitest";
import { getVipProgress } from "../client/src/lib/vip";

describe("Nexus VIP progress", () => {
  it("calculates the current tier and next-tier progress", () => {
    const result = getVipProgress(1820);
    expect(result.current.label).toBe("آمتیست");
    expect(result.next?.label).toBe("بنفش سلطنتی");
    expect(result.progress).toBe(21);
    expect(result.pointsToNext).toBe(1180);
  });

  it("clamps invalid and max-tier points safely", () => {
    expect(getVipProgress(-50).progress).toBe(0);
    expect(getVipProgress(Number.NaN).current.label).toBe("عضو پایه");
    expect(getVipProgress(9000).next).toBeNull();
    expect(getVipProgress(9000).progress).toBe(100);
  });
});
