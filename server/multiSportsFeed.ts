import type { MatchCardData } from "../shared/sports";
import { fetchSportsFeed, previewMatches, type SportsFeedResult } from "./sportsFeed";

type GenericGame = {
  id?: number | string;
  date?: string;
  timestamp?: number;
  time?: string;
  timezone?: string;
  teams?: { home?: { name?: string; logo?: string | null }; away?: { name?: string; logo?: string | null } };
  home?: { name?: string; logo?: string | null };
  away?: { name?: string; logo?: string | null };
  fixture?: { id?: number | string; date?: string; status?: { short?: string; long?: string; elapsed?: number | null } };
  league?: { name?: string };
  status?: { short?: string; long?: string; elapsed?: number | null } | string;
  scores?: { home?: number | null | { total?: number | null }; away?: number | null | { total?: number | null } };
  score?: { home?: number | null; away?: number | null };
};

type SportConfig = { label: string; baseUrl: string; endpoint: string };

export const SPORTS_DIRECTORY = [
  { code: "football", label: "فوتبال" },
  { code: "basketball", label: "بسکتبال" },
  { code: "baseball", label: "بیسبال" },
  { code: "handball", label: "هندبال" },
  { code: "hockey", label: "هاکی" },
  { code: "volleyball", label: "والیبال" },
  { code: "rugby", label: "راگبی" },
  { code: "american-football", label: "فوتبال آمریکایی" },
  { code: "afl", label: "فوتبال استرالیایی" },
  { code: "formula-1", label: "فرمول یک" },
  { code: "mma", label: "MMA" },
] as const;

const API_SPORTS: Record<string, SportConfig> = {
  basketball: { label: "بسکتبال", baseUrl: "https://v1.basketball.api-sports.io", endpoint: "games" },
  baseball: { label: "بیسبال", baseUrl: "https://v1.baseball.api-sports.io", endpoint: "games" },
  handball: { label: "هندبال", baseUrl: "https://v1.handball.api-sports.io", endpoint: "games" },
  hockey: { label: "هاکی", baseUrl: "https://v1.hockey.api-sports.io", endpoint: "games" },
  volleyball: { label: "والیبال", baseUrl: "https://v1.volleyball.api-sports.io", endpoint: "games" },
  rugby: { label: "راگبی", baseUrl: "https://v1.rugby.api-sports.io", endpoint: "games" },
  "american-football": { label: "فوتبال آمریکایی", baseUrl: "https://v1.american-football.api-sports.io", endpoint: "games" },
  afl: { label: "فوتبال استرالیایی", baseUrl: "https://v1.afl.api-sports.io", endpoint: "games" },
};

let cache: { expiresAt: number; result: SportsFeedResult } | null = null;

const faDigits = (value: string | number) => String(value).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date());

function statusOf(game: GenericGame): MatchCardData["status"] {
  const status = typeof game.status === "string" ? game.status : game.status?.short ?? game.status?.long ?? game.fixture?.status?.short ?? "";
  if (/live|in play|1h|2h|q[1-4]|set|ht|et|p/i.test(status)) return "زنده";
  return "امروز";
}

function scoreValue(value: number | null | { total?: number | null } | undefined) {
  if (typeof value === "number") return value;
  return value?.total ?? null;
}

function mapGenericGame(game: GenericGame, config: SportConfig): MatchCardData | null {
  const home = game.teams?.home ?? game.home;
  const away = game.teams?.away ?? game.away;
  const id = game.id ?? game.fixture?.id;
  if (!id || !home?.name || !away?.name) return null;
  const date = game.date ?? game.fixture?.date ?? (game.timestamp ? new Date(game.timestamp * 1000).toISOString() : undefined);
  const currentStatus = statusOf(game);
  const homeScore = scoreValue(game.scores?.home ?? game.score?.home);
  const awayScore = scoreValue(game.scores?.away ?? game.score?.away);
  const statusRaw = typeof game.status === "string" ? game.status : game.status?.short ?? game.fixture?.status?.short ?? "";
  const elapsed = typeof game.status === "object" ? game.status.elapsed : game.fixture?.status?.elapsed;
  return {
    id: `${config.label}-${id}`,
    league: game.league?.name ?? `مسابقات ${config.label}`,
    sport: config.label,
    status: currentStatus,
    time: date ? new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(date)) : game.time ?? "—",
    minute: currentStatus === "زنده" && elapsed != null ? `${faDigits(elapsed)}′` : undefined,
    home: home.name,
    homeLogo: home.logo ?? "",
    away: away.name,
    awayLogo: away.logo ?? "",
    score: homeScore != null && awayScore != null ? `${homeScore} — ${awayScore}` : undefined,
    markets: [],
    insight: `دادهٔ ${config.label} از API-Sports؛ وضعیت ${statusRaw || "زمان‌بندی‌شده"}`,
  };
}

async function fetchGenericSport(code: string, apiKey: string, live: boolean): Promise<MatchCardData[]> {
  const config = API_SPORTS[code];
  if (!config) return [];
  const query = live ? "games?live=all" : `games?date=${today()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${config.baseUrl}/${query}`, { headers: { "x-apisports-key": apiKey }, signal: controller.signal });
    if (!response.ok) return [];
    const payload = await response.json() as { response?: GenericGame[]; errors?: unknown };
    if (Array.isArray(payload.errors) && payload.errors.length > 0) return [];
    return (payload.response ?? []).flatMap((game) => { const mapped = mapGenericGame(game, config); return mapped ? [mapped] : []; });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSportsUniverse(apiKey: string, limit = 10, live = false): Promise<SportsFeedResult> {
  if (!apiKey) {
    if (live) return { matches: [], source: "fallback", error: "SPORTS_API_KEY تنظیم نشده است." };
    return { matches: previewMatches.slice(0, Math.max(limit, 3)), source: "preview", error: "SPORTS_API_KEY تنظیم نشده است؛ مسابقه‌ها فقط برای پیش‌نمایش هستند و بازار شرط فعال نیست." };
  }
  if (!live && cache && cache.expiresAt > Date.now()) return cache.result;
  const football = await fetchSportsFeed(live ? "fixtures?live=all" : `fixtures?next=${limit}`, apiKey);
  const codes = Object.keys(API_SPORTS);
  const otherMatches = (await Promise.all(codes.map((code) => fetchGenericSport(code, apiKey, live)))).flat();
  const realMatches = [...(football.source === "api" ? football.matches : []), ...otherMatches];
  const result: SportsFeedResult = realMatches.length ? { matches: realMatches.slice(0, Math.max(limit, 30)), source: "api", error: football.error && football.source !== "api" ? football.error : null } : { matches: football.matches, source: football.source, error: football.error };
  if (!live) cache = { expiresAt: Date.now() + 45_000, result };
  return result;
}
