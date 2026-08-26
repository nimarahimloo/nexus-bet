export type SportsApiFixture = {
  fixture?: {
    id?: number;
    date?: string;
    status?: { short?: string; elapsed?: number | null };
  };
  league?: { name?: string };
  teams?: {
    home?: { name?: string; logo?: string | null };
    away?: { name?: string; logo?: string | null };
  };
  goals?: { home?: number | null; away?: number | null };
};

export type MatchCardData = {
  id: string;
  league: string;
  sport: string;
  status: "زنده" | "امروز" | "فردا" | "نمونه";
  time: string;
  minute?: string;
  home: string;
  homeLogo: string;
  away: string;
  awayLogo: string;
  score?: string;
  markets: { label: string; name: string; odds: number }[];
  insight: string;
};

const toFaDigits = (value: string | number) => String(value).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

const faTime = (date?: string) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
};

export function mapSportsFixture(fixture: SportsApiFixture): MatchCardData | null {
  const id = fixture.fixture?.id;
  const home = fixture.teams?.home?.name;
  const away = fixture.teams?.away?.name;
  if (!id || !home || !away) return null;
  const shortStatus = fixture.fixture?.status?.short;
  const isLive = ["1H", "2H", "HT", "ET", "P"].includes(shortStatus ?? "");
  const status: MatchCardData["status"] = isLive ? "زنده" : "امروز";
  const homeGoals = fixture.goals?.home;
  const awayGoals = fixture.goals?.away;
  return {
    id: String(id),
    league: fixture.league?.name ?? "مسابقات فوتبال",
    sport: "فوتبال",
    status,
    time: faTime(fixture.fixture?.date),
    minute: isLive && fixture.fixture?.status?.elapsed != null ? `${toFaDigits(fixture.fixture.status.elapsed)}′` : undefined,
    home,
    homeLogo: fixture.teams?.home?.logo ?? "",
    away,
    awayLogo: fixture.teams?.away?.logo ?? "",
    score: homeGoals != null && awayGoals != null ? `${homeGoals} — ${awayGoals}` : undefined,
    markets: [],
    insight: isLive ? "دادهٔ زنده از API ورزشی" : "زمان‌بندی‌شده از API ورزشی",
  };
}

export function mapSportsFixtures(fixtures: SportsApiFixture[]): MatchCardData[] {
  return fixtures.flatMap((fixture) => {
    const mapped = mapSportsFixture(fixture);
    return mapped ? [mapped] : [];
  });
}

/**
 * Keeps the temporary feed on the same contract as the future API feed.
 * The seed carries only UI-specific markets/insight; identity and team data
 * still pass through the production fixture adapter.
 */
export function buildDemoMatchesFromAdapter(seeds: MatchCardData[]): MatchCardData[] {
  return seeds.flatMap((seed, index) => {
    const mapped = mapSportsFixture({
      fixture: { id: index + 1, date: "2026-08-27T18:30:00Z", status: { short: "NS", elapsed: null } },
      league: { name: seed.league },
      teams: {
        home: { name: seed.home, logo: seed.homeLogo },
        away: { name: seed.away, logo: seed.awayLogo },
      },
    });
    return mapped ? [{ ...mapped, ...seed }] : [];
  });
}
