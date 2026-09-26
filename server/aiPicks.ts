import type { AiCandidate, AiPick } from "../shared/ai";

/** Deterministic, non-guaranteed ranking from live feed candidates (no fabricated odds). */
export function rankSmartPicks(candidates: AiCandidate[], limit = 6): { picks: AiPick[]; source: "ai" | "empty" } {
  if (!candidates.length) return { picks: [], source: "empty" };

  const scored = candidates
    .filter((c) => Number.isFinite(c.odds) && c.odds > 1)
    .map((c) => {
      const popularity = Math.max(0, Math.min(100, c.popularity ?? 50));
      const odds = c.odds;
      // Prefer moderate odds; high popularity boosts confidence without claiming edge.
      const oddsFit = odds >= 1.4 && odds <= 2.6 ? 18 : odds < 1.4 ? 8 : 6;
      const confidence = Math.round(Math.max(42, Math.min(88, popularity * 0.55 + oddsFit + (c.status === "امروز" || c.status === "زنده" ? 6 : 0))));
      const risk: AiPick["risk"] = odds >= 3 ? "بالا" : odds >= 1.85 ? "متوسط" : "کم";
      const tags = [
        popularity >= 75 ? "پرطرفدار" : popularity >= 55 ? "قابل‌توجه" : "حاشیه‌ای",
        risk === "کم" ? "ریسک پایین‌تر" : risk === "متوسط" ? "ریسک متوسط" : "ریسک بالاتر",
      ];
      const rationale =
        risk === "کم"
          ? `ضریب ${odds.toFixed(2)} در محدودهٔ محتاطانه است و محبوبیت نسبی بازار ${Math.round(popularity)}٪ گزارش شده؛ این یک سیگنال توضیحی است نه توصیهٔ قطعی.`
          : risk === "متوسط"
            ? `بازار ${c.marketName} با ضریب ${odds.toFixed(2)} تعادل نسبی دارد؛ قبل از تصمیم، وضعیت مسابقه و موجودی خود را مستقل بررسی کن.`
            : `ضریب ${odds.toFixed(2)} نشان‌دهندهٔ ریسک بالاتر است؛ فقط با بخش کوچکی از موجودی و بدون انتظار سود تضمینی در نظر بگیر.`;
      return {
        ...c,
        risk,
        confidence,
        tags,
        rationale,
        _score: confidence + (risk === "کم" ? 4 : risk === "متوسط" ? 2 : 0),
      };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...pick }) => pick);

  return { picks: scored, source: scored.length ? "ai" : "empty" };
}
