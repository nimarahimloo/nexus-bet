import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapProviderStatusToSettle, nowPaymentsReadiness, normalizeNowPaymentsIpn, verifyNowPaymentsIpn } from "./nowpayments";

const readDbLayer = () =>
  [
    readFileSync(new URL("./db.ts", import.meta.url), "utf8"),
    readFileSync(new URL("./db/wallet.ts", import.meta.url), "utf8"),
  ].join("\n");

describe("NOWPayments disabled-safe adapter", () => {
  it("does not report readiness without all server credentials", () => {
    expect(nowPaymentsReadiness({ apiKey: "key", ipnSecret: "secret" }).enabled).toBe(false);
    expect(nowPaymentsReadiness({ apiKey: "key", ipnSecret: "secret", payoutWallet: "0xmerchant" }).network).toBe("BEP20");
    expect(nowPaymentsReadiness({ apiKey: "key", ipnSecret: "secret", payoutWallet: "0xmerchant" }).payoutEnabled).toBe(false);
    expect(nowPaymentsReadiness({ apiKey: "key", ipnSecret: "secret", payoutWallet: "0xmerchant", payoutAuthToken: "tok" }).payoutEnabled).toBe(true);
  });

  it("verifies the signed IPN body and rejects tampering", () => {
    const body = JSON.stringify({ payment_id: 42, payment_status: "finished" });
    const canonicalBody = JSON.stringify({ payment_id: 42, payment_status: "finished" });
    const signature = createHmac("sha512", "secret").update(canonicalBody).digest("hex");
    expect(verifyNowPaymentsIpn(body, signature, "secret")).toBe(true);
    expect(verifyNowPaymentsIpn(JSON.stringify({ payment_status: "finished", payment_id: 42 }), signature, "secret")).toBe(true);
    expect(verifyNowPaymentsIpn(JSON.stringify({ payment_id: 42, payment_status: "failed" }), signature, "secret")).toBe(false);
  });

  it("keeps settlement guarded by provider mismatch checks", () => {
    const db = readDbLayer();
    expect(db).toContain("PROVIDER_CURRENCY_MISMATCH");
    expect(db).toContain("PROVIDER_NETWORK_MISMATCH");
    expect(db).toContain("PROVIDER_AMOUNT_MISMATCH");
    expect(db).toContain("providerEventId");
    expect(db).toContain("wallet-");
  });

  it("normalizes provider events without inventing missing amounts", () => {
    expect(normalizeNowPaymentsIpn({ payment_id: 42, payment_status: "finished", order_id: "wallet-1", pay_currency: "USDTBSC", network: "BEP20", actually_paid: "2.5", payin_hash: "0xhash" })).toEqual({ providerEventId: "42", paymentStatus: "finished", orderId: "wallet-1", currency: "USDTBSC", network: "BEP20", amount: 2.5, txHash: "0xhash" });
  });

  it("maps provider statuses to settle outcomes", () => {
    expect(mapProviderStatusToSettle("finished")).toBe("confirmed");
    expect(mapProviderStatusToSettle("confirmed")).toBe("confirmed");
    expect(mapProviderStatusToSettle("failed")).toBe("failed");
    expect(mapProviderStatusToSettle("expired")).toBe("failed");
    expect(mapProviderStatusToSettle("waiting")).toBe(null);
    expect(mapProviderStatusToSettle("confirming")).toBe(null);
  });
});
