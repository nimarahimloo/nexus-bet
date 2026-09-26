import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import {
  NOWPAYMENTS_PROVIDER,
  mapProviderStatusToSettle,
  normalizeNowPaymentsIpn,
  nowPaymentsReadiness,
  verifyNowPaymentsIpn,
} from "./nowpayments";
import {
  attachWalletProviderTransaction,
  getWalletTransactionById,
  getWalletTransactionByProviderEvent,
  parseWalletOrderId,
  settleWalletProviderTransaction,
} from "./db";

function providerConfig() {
  return {
    apiKey: ENV.nowPaymentsApiKey,
    ipnSecret: ENV.nowPaymentsIpnSecret,
    payoutWallet: ENV.nowPaymentsPayoutWallet,
    payoutAuthToken: ENV.nowPaymentsPayoutAuthToken,
  };
}

export function registerNowPaymentsWebhook(app: Express) {
  app.post("/api/payments/nowpayments/ipn", async (req: Request & { rawBody?: string }, res: Response) => {
    const config = providerConfig();
    if (!nowPaymentsReadiness(config).enabled) {
      return res.status(503).json({ code: "PAYMENT_PROVIDER_NOT_CONFIGURED" });
    }

    const rawBody = req.rawBody ?? JSON.stringify(req.body ?? {});
    const signature = req.header("x-nowpayments-sig");
    if (!verifyNowPaymentsIpn(rawBody, signature, ENV.nowPaymentsIpnSecret)) {
      return res.status(401).json({ code: "INVALID_PROVIDER_SIGNATURE" });
    }

    try {
      const event = normalizeNowPaymentsIpn(req.body as Record<string, unknown>);
      const orderTxId = parseWalletOrderId(event.orderId);

      // Resolve ledger row: prefer order_id, fall back to existing provider event id.
      let transaction =
        (orderTxId ? await getWalletTransactionById(orderTxId) : null) ??
        (await getWalletTransactionByProviderEvent(NOWPAYMENTS_PROVIDER, event.providerEventId));

      if (!transaction) {
        return res.status(404).json({ code: "WALLET_TRANSACTION_NOT_FOUND", providerEventId: event.providerEventId });
      }

      // Always record latest provider status for audit (idempotent attach while pending).
      if (transaction.status === "pending") {
        await attachWalletProviderTransaction({
          transactionId: transaction.id,
          provider: NOWPAYMENTS_PROVIDER,
          providerEventId: event.providerEventId,
          providerStatus: event.paymentStatus,
          payloadJson: JSON.stringify(req.body ?? {}),
          txHash: event.txHash,
        });
      }

      const settleStatus = mapProviderStatusToSettle(event.paymentStatus);
      if (!settleStatus) {
        // Waiting / confirming / partially_paid — acknowledge without ledger movement.
        return res.status(200).json({ code: "ACK_PENDING", providerEventId: event.providerEventId, paymentStatus: event.paymentStatus });
      }

      const result = await settleWalletProviderTransaction({
        transactionId: transaction.id,
        status: settleStatus,
        provider: NOWPAYMENTS_PROVIDER,
        providerEventId: event.providerEventId,
        providerStatus: event.paymentStatus,
        providerCurrency: event.currency,
        providerNetwork: event.network ?? "BEP20",
        providerAmount: event.amount,
        payloadJson: JSON.stringify(req.body ?? {}),
        txHash: event.txHash,
      });

      return res.status(200).json({
        code: result.applied ? "SETTLED" : "ALREADY_SETTLED",
        status: result.status,
        providerEventId: event.providerEventId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "INVALID_PROVIDER_PAYLOAD";
      // Mismatch / not found are client errors; unknown are 500 so provider retries.
      if (
        message.includes("MISMATCH") ||
        message.includes("NOT_FOUND") ||
        message.includes("MISSING")
      ) {
        return res.status(400).json({ code: message });
      }
      console.error("[NOWPayments IPN]", error);
      return res.status(500).json({ code: "SETTLEMENT_ERROR" });
    }
  });
}
