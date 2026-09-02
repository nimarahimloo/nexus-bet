import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { nowPaymentsReadiness, normalizeNowPaymentsIpn, verifyNowPaymentsIpn } from "./nowpayments";

describe("NOWPayments disabled-safe adapter", () => {
  it("does not report readiness without all server credentials", () => {
    expect(nowPaymentsReadiness({ apiKey: "key", ipnSecret: "secret" }).enabled).toBe(false);
    expect(nowPaymentsReadiness({ apiKey: "key", ipnSecret: "secret", payoutWallet: "0xmerchant" }).network).toBe("BEP20");
  });

  it("verifies the signed IPN body and rejects tampering", () => {
    const body = JSON.stringify({ payment_id: 42, payment_status: "finished" });
    const signature = createHmac("sha512", "secret").update(body).digest("hex");
    expect(verifyNowPaymentsIpn(body, signature, "secret")).toBe(true);
    expect(verifyNowPaymentsIpn(`${body} `, signature, "secret")).toBe(false);
  });

  it("normalizes provider events without inventing missing amounts", () => {
    expect(normalizeNowPaymentsIpn({ payment_id: 42, payment_status: "finished", order_id: "wallet-1", pay_currency: "USDTBSC", network: "BEP20", actually_paid: "2.5", payin_hash: "0xhash" })).toEqual({ providerEventId: "42", paymentStatus: "finished", orderId: "wallet-1", currency: "USDTBSC", network: "BEP20", amount: 2.5, txHash: "0xhash" });
  });
});
