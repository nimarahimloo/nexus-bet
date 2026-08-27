import { mapSportsFixtures, type MatchCardData, type SportsApiFixture } from "../shared/sports";

export type SportsFeedResult = { matches: MatchCardData[]; source: "api" | "fallback"; error: string | null };

export async function fetchSportsFeed(path: string, apiKey: string): Promise<SportsFeedResult> {
  if (!apiKey) return { matches: [], source: "fallback", error: "SPORTS_API_KEY تنظیم نشده است." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://v3.football.api-sports.io/${path}`, { headers: { "x-apisports-key": apiKey }, signal: controller.signal });
    if (!response.ok) throw new Error(`Sports API ${response.status}`);
    const payload = await response.json() as { response?: SportsApiFixture[]; errors?: unknown };
    if (Array.isArray(payload.errors) && payload.errors.length > 0) throw new Error("Sports API returned errors");
    return { matches: mapSportsFixtures(payload.response ?? []), source: "api", error: null };
  } catch (error) {
    console.warn(`[Sports] Falling back for ${path}:`, error);
    return { matches: [], source: "fallback", error: path.includes("live") ? "دادهٔ زندهٔ مسابقات در دسترس نیست." : "دریافت دادهٔ مسابقات موقتاً ناموفق بود." };
  } finally { clearTimeout(timeout); }
}
