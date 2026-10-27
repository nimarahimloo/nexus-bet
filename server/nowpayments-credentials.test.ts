import { describe, expect, it } from "vitest";

describe("NOWPayments credentials", () => {
  it("uses the server-only API key for a lightweight provider check when configured", async () => {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      // The secure secret form was not accepted yet. Do not make an unauthenticated request.
      expect(apiKey).toBeUndefined();
      return;
    }

    const response = await fetch("https://api.nowpayments.io/v1/status", {
      headers: { "x-api-key": apiKey },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  }, 15_000);
});
