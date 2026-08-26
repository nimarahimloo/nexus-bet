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
