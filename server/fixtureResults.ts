/**
 * Reads final scores from API-Football (`v3.football.api-sports.io`) for the
 * fixtures referenced by pending tickets.
 *
 * Every failure mode collapses to `state: "unknown"`, which the settlement
 * layer treats as "leave the ticket pending". Settlement must never move money
 * on a feed it could not read.
 */

import type { FixtureResult } from "./settlement";

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"]);
const SCHEDULED_STATUSES = new Set(["TBD", "NS"]);
/** Postponed / cancelled / awarded / walked over: no fair result, so refund. */
const VOID_STATUSES = new Set(["PST", "CANC", "ABD", "AWD", "WO"]);

export type ApiFootballFixturePayload = {
  response?: {
    fixture?: {
      id?: number | string;
      status?: { short?: string; long?: string };
    };
    goals?: { home?: number | null; away?: number | null };
  }[];
  errors?: unknown;
};

export function stateFromApiStatus(
  short: string | undefined
): FixtureResult["state"] {
  const status = (short ?? "").trim().toUpperCase();
  if (FINISHED_STATUSES.has(status)) return "finished";
  if (VOID_STATUSES.has(status)) return "void";
  if (LIVE_STATUSES.has(status)) return "live";
  if (SCHEDULED_STATUSES.has(status)) return "scheduled";
  return "unknown";
}

export function mapApiFootballFixture(
  fixtureId: string,
  payload: ApiFootballFixturePayload | undefined
): FixtureResult {
  const fixture = payload?.response?.[0];
  const state = stateFromApiStatus(fixture?.fixture?.status?.short);
  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;
  return {
    fixtureId,
    state,
    homeGoals: typeof homeGoals === "number" ? homeGoals : null,
    awayGoals: typeof awayGoals === "number" ? awayGoals : null,
    error: fixture ? null : "FIXTURE_NOT_FOUND",
  };
}

export function unknownFixtureResult(
  fixtureId: string,
  error: string | null = null
): FixtureResult {
  return {
    fixtureId,
    state: "unknown",
    homeGoals: null,
    awayGoals: null,
    error,
  };
}

export async function fetchFixtureResult(
  fixtureId: string,
  apiKey: string
): Promise<FixtureResult> {
  if (!apiKey.trim())
    return unknownFixtureResult(fixtureId, "SPORTS_API_KEY_MISSING");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(fixtureId)}`,
      {
        headers: { "x-apisports-key": apiKey },
        signal: controller.signal,
      }
    );
    if (!response.ok)
      return unknownFixtureResult(fixtureId, `SPORTS_API_${response.status}`);
    const payload = (await response.json()) as ApiFootballFixturePayload;
    if (Array.isArray(payload.errors) && payload.errors.length > 0)
      return unknownFixtureResult(fixtureId, "SPORTS_API_ERRORS");
    return mapApiFootballFixture(fixtureId, payload);
  } catch (error) {
    return unknownFixtureResult(
      fixtureId,
      error instanceof Error ? error.name : "SPORTS_API_FETCH_FAILED"
    );
  } finally {
    clearTimeout(timeout);
  }
}
