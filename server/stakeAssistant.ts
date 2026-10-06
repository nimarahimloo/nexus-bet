export const riskProfileValues = ["conservative", "balanced", "assertive"] as const;
export type RiskProfile = (typeof riskProfileValues)[number];

const profileConfig: Record<RiskProfile, { maxBankrollShare: number; floorShare: number; label: string }> = {
  conservative: { maxBankrollShare: 0.01, floorShare: 0.005, label: "محافظه‌کار" },
  balanced: { maxBankrollShare: 0.02, floorShare: 0.01, label: "متعادل" },
  assertive: { maxBankrollShare: 0.03, floorShare: 0.015, label: "فعال" },
};

export type StakeSuggestionInput = {
  availableBalance: number;
  lockedBalance: number;
  combinedOdds: number;
  profile: RiskProfile;
};

export function calculateStakeSuggestion(input: StakeSuggestionInput) {
  const config = profileConfig[input.profile];
  const available = Number.isFinite(input.availableBalance) && input.availableBalance > 0 ? input.availableBalance : 0;
  const odds = Number.isFinite(input.combinedOdds) && input.combinedOdds > 0 ? input.combinedOdds : 1;
  const maxStake = Number(Math.min(available, available * config.maxBankrollShare).toFixed(2));
  const suggestedStake = Number(Math.min(maxStake, Math.max(0, available * config.floorShare)).toFixed(2));
  const potentialReturn = Number((suggestedStake * odds).toFixed(2));
  return {
    profile: input.profile,
    profileLabel: config.label,
    suggestedStake,
    minStake: Number(Math.min(maxStake, Math.max(1, available * config.floorShare * 0.5)).toFixed(2)),
    maxStake,
    potentialReturn,
    availableBalance: Number(available.toFixed(2)),
    lockedBalance: Number(Math.max(0, input.lockedBalance || 0).toFixed(2)),
    odds,
    guaranteed: false as const,
    reason: "این عدد فقط سقف محتاطانه‌ای از موجودی قابل‌استفاده است؛ نتیجه یا سود تضمین نمی‌شود.",
  };
}

export function normalizeRiskProfile(value: unknown): RiskProfile {
  return riskProfileValues.includes(value as RiskProfile) ? (value as RiskProfile) : "balanced";
}
