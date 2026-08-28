import { formatFaDecimal, formatFaTime } from "./format";

export function formatMatchKickoff(hour: number, minute: number): string {
  return formatFaTime(hour, minute);
}

export function formatMatchOdds(odds: number): string {
  return formatFaDecimal(odds);
}

export function formatCrashAmount(amount: number): string {
  return formatFaDecimal(Number.isFinite(amount) ? amount : 0);
}

export function formatCrashStakeLabel(amount: number): string {
  return `${formatCrashAmount(amount)} USDT`;
}

export function formatCrashCashoutLabel(amount: number): string {
  return `${formatCrashAmount(amount)} USDT`;
}

export function formatSportsFeedStatus(input: { loading: boolean; source?: "api" | "fallback"; error?: string | null; matchesCount?: number }): string {
  if (input.loading) return "در حال دریافت آخرین مسابقات…";
  if (input.error) return input.error;
  if (input.source === "api" && input.matchesCount === 0) return "اتصال به API برقرار است، اما فعلاً مسابقه‌ای برای نمایش برنگردانده است.";
  if (input.source === "api") return "آخرین مسابقات از API ورزشی";
  return "دادهٔ مسابقات در دسترس نیست.";
}
