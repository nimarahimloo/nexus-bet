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
    if (!address || typeof address === "string") throw new Error("TEST_SERVER_NOT_LISTENING");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const contentType = response.headers.get("content-type") ?? "";
    const payload = (await response.json()) as {
      ok?: boolean;
      database?: boolean;
      payments?: { provider?: string; enabled?: boolean; network?: string; currency?: string };
    };

    expect(response.status).toBe(200);
    expect(contentType).toContain("application/json");
    expect(payload).toMatchObject({
      ok: true,
      payments: {
        provider: "nowpayments",
        enabled: false,
        network: "BEP20",
        currency: "USDTBSC",
      },
    });
    expect(typeof payload.database).toBe("boolean");
  });
});
