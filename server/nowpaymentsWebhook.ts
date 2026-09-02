import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { normalizeNowPaymentsIpn, nowPaymentsReadiness, verifyNowPaymentsIpn } from "./nowpayments";

export function registerNowPaymentsWebhook(app: Express) {
  app.post("/api/payments/nowpayments/ipn", (req: Request & { rawBody?: string }, res: Response) => {
    const config = { apiKey: ENV.nowPaymentsApiKey, ipnSecret: ENV.nowPaymentsIpnSecret, payoutWallet: ENV.nowPaymentsPayoutWallet };
    if (!nowPaymentsReadiness(config).enabled) return res.status(503).json({ code: "PAYMENT_PROVIDER_NOT_CONFIGURED" });
    const rawBody = req.rawBody ?? JSON.stringify(req.body ?? {});
    const signature = req.header("x-nowpayments-sig");
    if (!verifyNowPaymentsIpn(rawBody, signature, ENV.nowPaymentsIpnSecret)) return res.status(401).json({ code: "INVALID_PROVIDER_SIGNATURE" });
    try {
      const event = normalizeNowPaymentsIpn(req.body as Record<string, unknown>);
      // Settlement is intentionally not performed in the scaffold until the provider account,
      // callback contract and sandbox are verified. Returning 503 asks the provider to retry.
      return res.status(503).json({ code: "PAYMENT_SETTLEMENT_NOT_ENABLED", providerEventId: event.providerEventId });
    } catch (error) {
      return res.status(400).json({ code: error instanceof Error ? error.message : "INVALID_PROVIDER_PAYLOAD" });
    }
  });
}
