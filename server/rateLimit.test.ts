import { describe, expect, it } from "vitest";
import type { Request } from "express";
import {
  RATE_LIMIT_RULES,
  clientIp,
  evaluateHits,
  rateLimitKey,
  windowStartFor,
} from "./_core/rateLimit";

describe("fixed windows", () => {
  it("snaps a timestamp to the start of its window", () => {
    const now = new Date("2026-10-25T12:07:31.500Z");
    expect(windowStartFor(now, 5 * 60_000).toISOString()).toBe(
      "2026-10-25T12:05:00.000Z"
    );
    expect(windowStartFor(now, 60 * 60_000).toISOString()).toBe(
      "2026-10-25T12:00:00.000Z"
    );
  });

  it("keeps the same window for the whole period and rolls at the boundary", () => {
    const start = windowStartFor(
      new Date("2026-10-25T12:05:00.000Z"),
      5 * 60_000
    ).getTime();
    expect(
      windowStartFor(new Date("2026-10-25T12:09:59.999Z"), 5 * 60_000).getTime()
    ).toBe(start);
    expect(
      windowStartFor(new Date("2026-10-25T12:10:00.000Z"), 5 * 60_000).getTime()
    ).toBe(start + 5 * 60_000);
  });
});

describe("bucket keys", () => {
  it("scopes by name, identifier and optional discriminator", () => {
    expect(rateLimitKey("login", "203.0.113.9", "nima")).toBe(
      "login:203.0.113.9:nima"
    );
    expect(rateLimitKey("signup", "203.0.113.9")).toBe("signup:203.0.113.9");
  });

  it("stays inside the 191-character index limit", () => {
    expect(rateLimitKey("login", "1".repeat(400), "u").length).toBe(191);
  });
});

describe("client address resolution", () => {
  const request = (
    headers: Record<string, string>,
    ip?: string,
    remoteAddress?: string
  ) =>
    ({
      headers,
      ip,
      socket: { remoteAddress },
    }) as unknown as Request;

  it("uses the first hop of x-forwarded-for", () => {
    expect(
      clientIp(request({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" }))
    ).toBe("198.51.100.4");
    expect(clientIp(request({ "x-forwarded-for": " 198.51.100.4 " }))).toBe(
      "198.51.100.4"
    );
  });

  it("falls back to the socket address, then to a constant", () => {
    expect(clientIp(request({}, "203.0.113.9"))).toBe("203.0.113.9");
    expect(clientIp(request({}, undefined, "192.0.2.7"))).toBe("192.0.2.7");
    expect(clientIp(undefined)).toBe("unknown");
  });
});

describe("rule evaluation", () => {
  const rule = RATE_LIMIT_RULES.login;
  const windowStart = new Date("2026-10-25T12:05:00.000Z");
  const now = new Date("2026-10-25T12:06:00.000Z");

  it("allows traffic up to the limit and reports the remainder of the window", () => {
    expect(evaluateHits(rule.limit, rule, windowStart, now)).toMatchObject({
      allowed: true,
      retryAfterMs: 0,
    });
  });

  it("blocks the first request over the limit and says how long to wait", () => {
    const result = evaluateHits(rule.limit + 1, rule, windowStart, now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(4 * 60_000);
  });

  it("keeps the shipped budgets tight enough to matter", () => {
    expect(RATE_LIMIT_RULES.login.limit).toBeLessThanOrEqual(5);
    expect(RATE_LIMIT_RULES.resetSubmit.limit).toBeLessThanOrEqual(5);
    expect(RATE_LIMIT_RULES.signup.limit).toBeLessThanOrEqual(3);
    expect(RATE_LIMIT_RULES.supportChatGuest.limit).toBeLessThanOrEqual(5);
  });
});
