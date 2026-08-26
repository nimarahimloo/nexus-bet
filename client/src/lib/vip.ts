export type VipTier = {
  id: string;
  label: string;
  minPoints: number;
  color: "silver" | "violet" | "royal" | "obsidian";
};

export const VIP_TIERS: VipTier[] = [
  { id: "base", label: "عضو پایه", minPoints: 0, color: "silver" },
  { id: "silver", label: "نقره‌ای", minPoints: 500, color: "silver" },
  { id: "amethyst", label: "آمتیست", minPoints: 1500, color: "violet" },
  { id: "royal", label: "بنفش سلطنتی", minPoints: 3000, color: "royal" },
  { id: "obsidian", label: "ابسیدین", minPoints: 6000, color: "obsidian" },
];

export function getVipProgress(points: number) {
  const safePoints = Number.isFinite(points) ? Math.max(0, points) : 0;
  let tierIndex = 0;
  for (let index = 0; index < VIP_TIERS.length; index += 1) {
    if (safePoints >= VIP_TIERS[index].minPoints) tierIndex = index;
  }

  const current = VIP_TIERS[tierIndex];
  const next = VIP_TIERS[tierIndex + 1];
  if (!next) return { current, next: null, points: safePoints, progress: 100, pointsToNext: 0 };

  const span = next.minPoints - current.minPoints;
  const progress = Math.min(100, Math.max(0, Math.round(((safePoints - current.minPoints) / span) * 100)));
  return { current, next, points: safePoints, progress, pointsToNext: Math.max(0, next.minPoints - safePoints) };
}
