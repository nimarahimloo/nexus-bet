import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createApp } from "./app";
import { buildHealthPayload } from "./health";
import { isSecureRequest, securityHeadersFor } from "./_core/securityHeaders";

describe("health payload", () => {
  it("is not ok when the database is down", () => {
    const payload = buildHealthPayload({ dbOk: false, sportsConfigured: true, uptimeSeconds: 12 });
    expect(payload.ok).toBe(false);
    expect(payload.database).toBe("down");
  });

  it("is ok only when a query actually round-tripped", () => {
    const payload = buildHealthPayload({ dbOk: true, sportsConfigured: false, uptimeSeconds: 12.6 });
    expect(payload).toEqual({ ok: true, database: "up", sports: "missing", uptimeSeconds: 13 });
  });

  it("never rounds uptime below zero", () => {
    expect(buildHealthPayload({ dbOk: true, sportsConfigured: true, uptimeSeconds: -5 }).uptimeSeconds).toBe(0);
  });
});

describe("security headers", () => {
  it("always sends the baseline set", () => {
    const headers = securityHeadersFor({ secure: false });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("adds HSTS only over TLS", () => {
    expect(securityHeadersFor({ secure: true })["Strict-Transport-Security"]).toContain("max-age=31536000");
  });

  it("recognises a proxied https request", () => {
    expect(isSecureRequest({ secure: false, headers: { "x-forwarded-proto": "https" } } as never)).toBe(true);
    expect(isSecureRequest({ secure: false, headers: { "x-forwarded-proto": "http" } } as never)).toBe(false);
    expect(isSecureRequest({ secure: true, headers: {} } as never)).toBe(true);
  });
});

describe("GET /api/health over HTTP", () => {
  let server: Server;
  let base = "";

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("reports database truthfully and does not leak provider config", async () => {
    const response = await fetch(`${base}/api/health`);
    const body = await response.json() as Record<string, unknown>;

    expect([200, 503]).toContain(response.status);
    expect(body.ok).toBe(response.status === 200);
    expect(["up", "down"]).toContain(body.database);
    // Regression guard: payment readiness and env flags used to be public here.
    expect(body).not.toHaveProperty("payments");
    expect(body).not.toHaveProperty("env");
  });

  it("sends hardening headers and hides the framework", async () => {
    const response = await fetch(`${base}/api/health`);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});
