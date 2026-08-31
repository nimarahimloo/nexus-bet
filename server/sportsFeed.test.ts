import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSportsFeed } from "./sportsFeed";
import { formatSportsFeedStatus } from "../shared/sportsDisplay";

afterEach(() => vi.restoreAllMocks());

describe("sports feed contract", () => {
  it("maps a successful live response and keeps API source", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: [], response: [{ fixture: { id: 7, date: "2026-08-27T18:30:00Z", status: { short: "1H", elapsed: 32 } }, league: { name: "لیگ نمونه" }, teams: { home: { name: "میزبان", logo: null }, away: { name: "مهمان", logo: null } }, goals: { home: 1, away: 0 } }] }), { status: 200, headers: { "content-type": "application/json" } })));
    const result = await fetchSportsFeed("fixtures?live=all", "test-key");
    expect(result.source).toBe("api");
    expect(result.error).toBeNull();
    expect(result.matches[0]?.status).toBe("زنده");
    expect(result.matches[0]?.minute).toBe("۳۲′");
  });

  it("enriches API fixtures with numeric odds from the official odds response", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [], response: [{ fixture: { id: 8, date: "2026-08-27T18:30:00Z", status: { short: "NS", elapsed: null } }, league: { name: "Premier League" }, teams: { home: { name: "Home FC" }, away: { name: "Away FC" } } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [], response: [{ bookmakers: [{ bets: [{ name: "Match Winner", values: [{ value: "Home", odd: "2.10" }, { value: "Draw", odd: "3.30" }, { value: "Away", odd: "3.80" }] }] }] } ] }), { status: 200 })));
    const result = await fetchSportsFeed("fixtures?next=10", "test-key");
    expect(result.source).toBe("api");
    expect(result.matches[0]?.markets).toEqual([{ label: "۱", name: "Home", odds: 2.1 }, { label: "X", name: "Draw", odds: 3.3 }, { label: "۲", name: "Away", odds: 3.8 }]);
  });

  it("returns an explicit fallback error for failed fixtures/live calls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("upstream failure", { status: 503 })));
    const result = await fetchSportsFeed("fixtures?live=all", "test-key");
    expect(result).toEqual({ matches: [], source: "fallback", error: "دادهٔ زندهٔ مسابقات در دسترس نیست." });
  });

  it("maps the scheduled fixtures path independently and serves explicit preview fixtures on upstream failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: [], response: [] }), { status: 200, headers: { "content-type": "application/json" } })));
    const success = await fetchSportsFeed("fixtures?next=10", "test-key");
    expect(success.source).toBe("preview");
    expect(success.matches).toHaveLength(3);
    expect(success.error).toContain("پاسخ API خالی");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("upstream failure", { status: 503 })));
    const fallback = await fetchSportsFeed("fixtures?next=10", "test-key");
    expect(fallback.source).toBe("preview");
    expect(fallback.matches).toHaveLength(3);
    expect(fallback.matches.every((match) => match.status === "نمونه" && match.markets.length === 0)).toBe(true);
    expect(fallback.error).toContain("فقط برای پیش‌نمایش");
  });

  it("keeps Home's fallback message user-facing and deterministic", () => {
    expect(formatSportsFeedStatus({ loading: false, source: "fallback", error: "دریافت دادهٔ مسابقات موقتاً ناموفق بود." })).toBe("دریافت دادهٔ مسابقات موقتاً ناموفق بود.");
    expect(formatSportsFeedStatus({ loading: false, source: "fallback", error: null })).toBe("نمایش فید نمونه تا زمان دسترسی به دادهٔ واقعی");
    expect(formatSportsFeedStatus({ loading: false, source: "preview", error: "محدودیت API؛ مسابقه‌ها فقط برای پیش‌نمایش هستند و بازار شرط فعال نیست." })).toContain("فقط برای پیش‌نمایش");
  });
});
