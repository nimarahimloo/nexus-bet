import { mapSportsDetails, mapSportsFixtures, mapSportsOdds, type MatchCardData, type MatchDetailData, type SportsApiDetailPayload, type SportsApiFixture, type SportsApiOddsPayload } from "../shared/sports";

export type SportsFeedResult = { matches: MatchCardData[]; source: "api" | "fallback" | "preview"; error: string | null };

export const previewMatches: MatchCardData[] = [
  { id: "preview-1", league: "لیگ پیش‌نمایش فوتبال", sport: "فوتبال", status: "نمونه", time: "۲۰:۳۰", home: "نکسوس یونایتد", homeLogo: "", away: "ویولت سیتی", awayLogo: "", markets: [], insight: "دادهٔ تستی؛ بازار شرط فعال نیست" },
  { id: "preview-2", league: "جام پیش‌نمایش اروپا", sport: "فوتبال", status: "نمونه", time: "۲۲:۰۰", home: "پرسپولیس", homeLogo: "", away: "استقلال", awayLogo: "", markets: [], insight: "دادهٔ تستی؛ بازار شرط فعال نیست" },
  { id: "preview-3", league: "تور پیش‌نمایش تنیس", sport: "تنیس", status: "نمونه", time: "فردا ۱۸:۰۰", home: "آریا کریمی", homeLogo: "", away: "سام نادری", awayLogo: "", markets: [], insight: "دادهٔ تستی؛ بازار شرط فعال نیست" },
];

export async function fetchSportsDetails(fixtureId: string, apiKey: string): Promise<MatchDetailData> {
  const empty: MatchDetailData = { fixtureId, source: "fallback", error: "جزئیات واقعی در دسترس نیست.", statistics: [], lineups: [], events: [] };
  if (!apiKey) return empty;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const request = async (resource: string): Promise<unknown[]> => {
    const response = await fetch(`https://v3.football.api-sports.io/${resource}?fixture=${encodeURIComponent(fixtureId)}`, { headers: { "x-apisports-key": apiKey }, signal: controller.signal });
    if (!response.ok) throw new Error(`Sports API ${resource} ${response.status}`);
    const payload = await response.json() as { response?: SportsApiDetailPayload[]; errors?: unknown };
    if (Array.isArray(payload.errors) && payload.errors.length > 0) throw new Error(`Sports API ${resource} returned errors`);
    return payload.response ?? [];
  };
  try {
    const [statistics, lineups, events] = await Promise.all([request("fixtures/statistics"), request("fixtures/lineups"), request("fixtures/events")]);
    return mapSportsDetails(fixtureId, { statistics: { statistics: statistics as NonNullable<SportsApiDetailPayload["statistics"]> }, lineups: { lineups: lineups as NonNullable<SportsApiDetailPayload["lineups"]> }, events: { events: events as NonNullable<SportsApiDetailPayload["events"]> } });
  } catch (error) {
    console.warn(`[Sports details] Falling back for fixture ${fixtureId}:`, error);
    return empty;
  } finally { clearTimeout(timeout); }
}

export async function fetchSportsFeed(path: string, apiKey: string): Promise<SportsFeedResult> {
  if (!apiKey) return { matches: [], source: "fallback", error: "SPORTS_API_KEY تنظیم نشده است." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://v3.football.api-sports.io/${path}`, { headers: { "x-apisports-key": apiKey }, signal: controller.signal });
    if (!response.ok) throw new Error(`Sports API ${response.status}`);
    const payload = await response.json() as { response?: SportsApiFixture[]; errors?: unknown };
    if (Array.isArray(payload.errors) && payload.errors.length > 0) throw new Error("Sports API returned errors");
    const matches = mapSportsFixtures(payload.response ?? []);
    if (matches.length) {
      const enriched = await Promise.all(matches.map(async (match) => {
        try {
          const oddsResponse = await fetch(`https://v3.football.api-sports.io/odds?fixture=${encodeURIComponent(match.id)}`, { headers: { "x-apisports-key": apiKey }, signal: controller.signal });
          if (!oddsResponse.ok) return match;
          const oddsPayload = await oddsResponse.json() as { response?: SportsApiOddsPayload[]; errors?: unknown };
          if (Array.isArray(oddsPayload.errors) && oddsPayload.errors.length > 0) return match;
          return { ...match, markets: mapSportsOdds(oddsPayload.response?.[0]) };
        } catch {
          return match;
        }
      }));
      return { matches: enriched, source: "api", error: null };
    }
    if (!matches.length && !path.includes("live")) return { matches: previewMatches, source: "preview", error: "پاسخ API خالی است؛ مسابقه‌ها فقط برای پیش‌نمایش هستند و بازار شرط فعال نیست." };
    return { matches, source: "api", error: null };
  } catch (error) {
    console.warn(`[Sports] Falling back for ${path}:`, error);
    if (!path.includes("live")) return { matches: previewMatches, source: "preview", error: "محدودیت API؛ مسابقه‌ها فقط برای پیش‌نمایش هستند و بازار شرط فعال نیست." };
    return { matches: [], source: "fallback", error: "دادهٔ زندهٔ مسابقات در دسترس نیست." };
  } finally { clearTimeout(timeout); }
}
