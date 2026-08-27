import { randomInt } from "node:crypto";

export type WheelReward = {
  code: string;
  label: string;
  type: "none" | "usdt";
  amount: number;
  weight: number;
};

export const WHEEL_REWARDS: readonly WheelReward[] = [
  { code: "none", label: "این بار نه", type: "none", amount: 0, weight: 55 },
  { code: "usdt_025", label: "۰٫۲۵ USDT", type: "usdt", amount: 0.25, weight: 25 },
  { code: "usdt_050", label: "۰٫۵۰ USDT", type: "usdt", amount: 0.5, weight: 12 },
  { code: "usdt_100", label: "۱ USDT", type: "usdt", amount: 1, weight: 6 },
  { code: "usdt_200", label: "۲ USDT", type: "usdt", amount: 2, weight: 2 },
] as const;

export function getUtcDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function selectWheelReward(randomValue = randomInt(0, totalWeight())): WheelReward {
  let cursor = randomValue;
  for (const reward of WHEEL_REWARDS) {
    cursor -= reward.weight;
    if (cursor < 0) return reward;
  }
  return WHEEL_REWARDS[WHEEL_REWARDS.length - 1];
}

export function totalWeight(): number {
  return WHEEL_REWARDS.reduce((sum, reward) => sum + reward.weight, 0);
}

export function getWheelSegments() {
  return WHEEL_REWARDS.map(({ code, label, type, amount }) => ({ code, label, type, amount }));
}
