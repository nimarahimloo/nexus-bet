import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { createApp } from "./app";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close(error => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

describe("GET /api/health", () => {
  it("returns JSON health data instead of the SPA fallback", async () => {
    server = createServer(createApp());
    await new Promise<void>((resolve, reject) => {
      server?.listen(0, "127.0.0.1", () => resolve());
      server?.once("error", reject);
    });

    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("TEST_SERVER_NOT_LISTENING");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const contentType = response.headers.get("content-type") ?? "";
    const payload = (await response.json()) as {
      ok?: boolean;
      database?: "up" | "down";
      sports?: "configured" | "missing";
    };

    // Intent of this test: the route answers JSON, never the SPA fallback.
    expect(contentType).toContain("application/json");
    // Status now tracks the database probe; no DB in tests means 503.
    expect([200, 503]).toContain(response.status);
    expect(payload.ok).toBe(response.status === 200);
    expect(["up", "down"]).toContain(payload.database);
    expect(["configured", "missing"]).toContain(payload.sports);
    // Regression guard: provider readiness used to be published here.
    expect(payload).not.toHaveProperty("payments");
  });
});
