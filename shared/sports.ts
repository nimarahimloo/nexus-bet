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
export type MatchDetailData = {
  fixtureId: string;
  source: "api" | "demo" | "fallback" | "empty";
  error: string | null;
  statistics: { label: string; home: string; away: string }[];
  lineups: { team: string; formation?: string; players: { name: string; position: string; number?: number }[] }[];
  events: { minute: string; team: string; player: string; type: string; detail?: string }[];
};

export type SportsApiOddsValue = { value?: string; odd?: string };
export type SportsApiOddsPayload = { bookmakers?: { bets?: { name?: string; values?: SportsApiOddsValue[] }[] }[] };

export function mapSportsOdds(payload: SportsApiOddsPayload | undefined) {
  const bets = payload?.bookmakers?.flatMap((bookmaker) => bookmaker.bets ?? []) ?? [];
  const winnerBet = bets.find((bet) => (bet.values?.length ?? 0) >= 2 && /match winner|1x2|winner/i.test(bet.name ?? "")) ?? bets.find((bet) => (bet.values?.length ?? 0) >= 2);
  if (!winnerBet?.values?.length) return [];
  return winnerBet.values.slice(0, 3).flatMap((value, index) => {
    const odds = Number(value.odd);
    if (!Number.isFinite(odds) || odds <= 1) return [];
    const labels = ["۱", "X", "۲"];
    const names = ["برد میزبان", "مساوی", "برد مهمان"];
    return [{ label: labels[index] ?? String(index + 1), name: value.value ?? names[index] ?? `بازار ${index + 1}`, odds }];
  });
}

export type SportsApiDetailPayload = {
  statistics?: { team?: { name?: string }; statistics?: { type?: string; value?: string | number | null }[] }[];
  lineups?: { team?: { name?: string }; formation?: string; startXI?: { player?: { name?: string; number?: number; pos?: string } }[] }[];
  events?: { time?: { elapsed?: number; extra?: number | null }; team?: { name?: string }; player?: { name?: string }; type?: string; detail?: string }[];
};

export function mapSportsDetails(fixtureId: string, payloads: { statistics?: SportsApiDetailPayload; lineups?: SportsApiDetailPayload; events?: SportsApiDetailPayload }): MatchDetailData {
  const statistics = (payloads.statistics?.statistics ?? []).flatMap((team) => (team.statistics ?? []).map((stat) => ({ label: stat.type ?? "آمار", home: team.team?.name ?? "تیم میزبان", away: String(stat.value ?? "—") })));
  const lineups = (payloads.lineups?.lineups ?? []).map((lineup) => ({ team: lineup.team?.name ?? "تیم", formation: lineup.formation, players: (lineup.startXI ?? []).map(({ player }) => ({ name: player?.name ?? "بازیکن", position: player?.pos ?? "—", number: player?.number })) }));
  const events = (payloads.events?.events ?? []).map((event) => ({ minute: `${toFaDigits(event.time?.elapsed ?? 0)}′`, team: event.team?.name ?? "—", player: event.player?.name ?? "—", type: event.type ?? "رویداد", detail: event.detail }));
  return { fixtureId, source: "api", error: null, statistics, lineups, events };
}

