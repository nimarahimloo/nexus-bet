import { describe, expect, it } from "vitest";
import { calculatePotentialReturn, combinedOdds, isValidUsdtStake } from "./betting";

describe("محاسبات بت‌اسلیپ", () => {
  it("ضریب ترکیبی چند انتخاب را با دقت دو رقم محاسبه می‌کند", () => {
    expect(combinedOdds([{ odds: 1.85 }, { odds: 2.1 }])).toBe(3.89);
  });

  it("بازده احتمالی USDT را برای ورودی معتبر برمی‌گرداند", () => {
    expect(calculatePotentialReturn(25, 3.89)).toBe(97.25);
  });

  it("ورودی‌های کم‌تر از حداقل یا بزرگ‌تر از موجودی را رد می‌کند", () => {
    expect(isValidUsdtStake(0.5, 125)).toBe(false);
    expect(isValidUsdtStake(126, 125)).toBe(false);
    expect(isValidUsdtStake(25, 125)).toBe(true);
  });
});
