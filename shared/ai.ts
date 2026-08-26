export type AiCandidate = {
  eventId: string;
  league: string;
  match: string;
  sport: string;
  marketLabel: string;
  marketName: string;
  odds: number;
  status: string;
  popularity: number;
};

export type AiPick = AiCandidate & {
  risk: "کم" | "متوسط" | "بالا";
  confidence: number;
  rationale: string;
  tags: string[];
};

export function fallbackSmartPicks(candidates: AiCandidate[]): AiPick[] {
  return candidates
    .filter((candidate) => candidate.odds > 1)
    .map((candidate) => {
      const stability = candidate.odds <= 2.1 ? 1 : candidate.odds <= 3.2 ? 0.72 : 0.48;
      const confidence = Math.round(Math.min(92, Math.max(54, stability * 76 + candidate.popularity * 0.18)));
      const risk: AiPick["risk"] = confidence >= 75 ? "کم" : confidence >= 62 ? "متوسط" : "بالا";
      return {
        ...candidate,
        risk,
        confidence,
        rationale: candidate.status === "زنده"
          ? "ریتم زنده و محبوبیت انتخاب، این بازار را برای بررسی سریع برجسته کرده است."
          : "ضریب متعادل و توجه کاربران، این انتخاب را برای مقایسهٔ آگاهانه مناسب کرده است.",
        tags: candidate.status === "زنده" ? ["زنده", "محبوب"] : ["محبوب", "ضریب متعادل"],
      };
    })
    .sort((a, b) => b.confidence - a.confidence || b.popularity - a.popularity)
    .slice(0, 3);
}
