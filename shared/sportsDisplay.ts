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

export function formatSportsFeedStatus(input: { loading: boolean; source?: "api" | "fallback" | "preview"; error?: string | null }): string {
  if (input.loading) return "در حال دریافت آخرین مسابقات…";
  if (input.source === "api") return "آخرین مسابقات از API ورزشی";
  if (input.source === "preview") return input.error ?? "چند مسابقه فقط برای پیش‌نمایش";
  return input.error ?? "نمایش فید نمونه تا زمان دسترسی به دادهٔ واقعی";
}
