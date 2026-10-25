import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { allowedHostsFromPublicUrl, hostFromOrigin, isSameOrigin, originGuard } from "./_core/originGuard";
import { getSessionCookieOptions } from "./_core/cookies";

function fakeRes() {
  const calls: { status?: number; body?: unknown; next: boolean } = { next: false };
  const res = {
    status(code: number) { calls.status = code; return this; },
    json(body: unknown) { calls.body = body; return this; },
  };
  return { calls, res: res as unknown as Response };
}

function run(method: string, headers: Record<string, string | undefined>) {
  const { calls, res } = fakeRes();
  const next = (() => { calls.next = true; }) as NextFunction;
  originGuard([])({ method, headers } as unknown as Request, res, next);
  return calls;
}

describe("origin resolution", () => {
  it("reads a host from a valid origin and rejects junk", () => {
    expect(hostFromOrigin("https://nexus-bet.app")).toBe("nexus-bet.app");
    expect(hostFromOrigin("http://localhost:3000")).toBe("localhost:3000");
    expect(hostFromOrigin("not-a-url")).toBeNull();
    expect(hostFromOrigin("ftp://files.example.com")).toBeNull();
  });

  it("requires an exact host match, port included", () => {
    expect(isSameOrigin("https://nexus-bet.app", "nexus-bet.app")).toBe(true);
    expect(isSameOrigin("https://nexus-bet.app", "evil.app")).toBe(false);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(isSameOrigin("http://localhost:4000", "localhost:3000")).toBe(false);
  });

  it("lets non-browser clients through and blocks unparseable origins", () => {
    expect(isSameOrigin(undefined, "nexus-bet.app")).toBe(true);
    expect(isSameOrigin("null", "nexus-bet.app")).toBe(false);
    expect(isSameOrigin("https://nexus-bet.app", undefined)).toBe(false);
  });

  it("accepts hosts declared by the public URL configuration", () => {
    expect(isSameOrigin("https://app.example.com", "internal.proxy", ["app.example.com"])).toBe(true);
    expect(allowedHostsFromPublicUrl("https://app.example.com/")).toEqual(["app.example.com"]);
    expect(allowedHostsFromPublicUrl("")).toEqual([]);
    expect(allowedHostsFromPublicUrl(undefined)).toEqual([]);
  });
});

describe("origin guard middleware", () => {
  it("blocks a cross-site POST before any route runs", () => {
    const calls = run("POST", { origin: "https://evil.example", host: "nexus-bet.app" });
    expect(calls.next).toBe(false);
    expect(calls.status).toBe(403);
    expect(calls.body).toEqual({ error: "CROSS_ORIGIN_BLOCKED" });
  });

  it("allows a same-site POST", () => {
    const calls = run("POST", { origin: "https://nexus-bet.app", host: "nexus-bet.app" });
    expect(calls.next).toBe(true);
    expect(calls.status).toBeUndefined();
  });

  it("ignores safe methods so reads keep working", () => {
    expect(run("GET", { origin: "https://evil.example", host: "nexus-bet.app" }).next).toBe(true);
    expect(run("OPTIONS", { origin: "https://evil.example", host: "nexus-bet.app" }).next).toBe(true);
  });

  it("allows credentialled callers that send no Origin (cron, curl, webhooks)", () => {
    expect(run("POST", { host: "nexus-bet.app" }).next).toBe(true);
  });

  it("honours the configured public host behind a proxy", () => {
    const { calls, res } = fakeRes();
    const next = vi.fn(() => { calls.next = true; }) as unknown as NextFunction;
    originGuard(["app.example.com"])({
      method: "POST",
      headers: { origin: "https://app.example.com", "x-forwarded-host": "internal-lb" },
    } as unknown as Request, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("session cookie policy", () => {
  const request = (protocol: string, hostname: string, headers: Record<string, string> = {}) => ({
    protocol,
    hostname,
    headers,
  }) as unknown as Request;

  it("never emits SameSite=None, even on a public https host", () => {
    const options = getSessionCookieOptions(request("https", "nexus-bet.app"));
    expect(options.sameSite).toBe("lax");
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
  });

  it("keeps Lax and drops Secure on local http so development login still works", () => {
    const options = getSessionCookieOptions(request("http", "localhost"));
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });

  it("treats a TLS-terminating proxy as secure", () => {
    const options = getSessionCookieOptions(request("http", "nexus-bet.app", { "x-forwarded-proto": "https" }));
    expect(options.secure).toBe(true);
  });
});
