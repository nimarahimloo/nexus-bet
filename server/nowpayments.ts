import { createHmac, timingSafeEqual } from "node:crypto";

export const NOWPAYMENTS_PROVIDER = "nowpayments" as const;
export const NOWPAYMENTS_NETWORK = "BEP20" as const;
export const NOWPAYMENTS_CURRENCY = "USDTBSC" as const;
const API_BASE_URL = "https://api.nowpayments.io";

type ProviderConfig = {
  apiKey?: string;
  ipnSecret?: string;
  payoutWallet?: string;
  payoutAuthToken?: string;
  apiBaseUrl?: string;
};

export type ProviderReadiness = {
  provider: typeof NOWPAYMENTS_PROVIDER;
  enabled: boolean;
  network: typeof NOWPAYMENTS_NETWORK;
  currency: typeof NOWPAYMENTS_CURRENCY;
  reason: "ready" | "missing_credentials";
};

export function nowPaymentsReadiness(config: ProviderConfig): ProviderReadiness {
  const enabled = Boolean(config.apiKey?.trim() && config.ipnSecret?.trim() && config.payoutWallet?.trim());
  return { provider: NOWPAYMENTS_PROVIDER, enabled, network: NOWPAYMENTS_NETWORK, currency: NOWPAYMENTS_CURRENCY, reason: enabled ? "ready" : "missing_credentials" };
}

function requireConfigured(config: ProviderConfig) {
  if (!nowPaymentsReadiness(config).enabled) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  return { apiKey: config.apiKey!.trim(), baseUrl: config.apiBaseUrl?.trim() || API_BASE_URL };
}

async function providerRequest<T>(config: ProviderConfig, path: string, body: Record<string, unknown>): Promise<T> {
  const { apiKey, baseUrl } = requireConfigured(config);
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { "x-api-key": apiKey, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PAYMENT_PROVIDER_HTTP_${response.status}`);
  return response.json() as Promise<T>;
}

export type CreatePaymentInput = { priceAmount: number; priceCurrency: string; orderId: string; orderDescription: string; ipnCallbackUrl: string; payCurrency?: typeof NOWPAYMENTS_CURRENCY };
export type CreatePaymentResult = { payment_id?: number | string; pay_address?: string; pay_amount?: number | string; pay_currency?: string; payment_status?: string; order_id?: string };
export type CreateInvoiceInput = { priceAmount: number; priceCurrency: string; orderId: string; orderDescription: string; ipnCallbackUrl: string; successUrl: string; cancelUrl: string; payCurrency?: typeof NOWPAYMENTS_CURRENCY };
export type CreateInvoiceResult = { id?: number | string; invoice_url?: string; invoice_status?: string; order_id?: string; pay_currency?: string; price_amount?: number | string };
export type CreatePayoutInput = { address: string; amount: number; currency?: typeof NOWPAYMENTS_CURRENCY; ipnCallbackUrl: string };
export type CreatePayoutResult = { id?: string | number; batch_withdrawal_id?: string | number; status?: string; withdrawals?: Array<{ id?: string | number; status?: string; address?: string; currency?: string; amount?: number | string }> };

export function createNowPaymentsPayment(config: ProviderConfig, input: CreatePaymentInput) {
  return providerRequest<CreatePaymentResult>(config, "/v1/payment", { price_amount: input.priceAmount, price_currency: input.priceCurrency, pay_currency: input.payCurrency ?? NOWPAYMENTS_CURRENCY, order_id: input.orderId, order_description: input.orderDescription, ipn_callback_url: input.ipnCallbackUrl });
}

export function createNowPaymentsInvoice(config: ProviderConfig, input: CreateInvoiceInput) {
  return providerRequest<CreateInvoiceResult>(config, "/v1/invoice", { price_amount: input.priceAmount, price_currency: input.priceCurrency, pay_currency: input.payCurrency ?? NOWPAYMENTS_CURRENCY, order_id: input.orderId, order_description: input.orderDescription, ipn_callback_url: input.ipnCallbackUrl, success_url: input.successUrl, cancel_url: input.cancelUrl });
}

export async function createNowPaymentsPayout(config: ProviderConfig, input: CreatePayoutInput) {
  const { apiKey, baseUrl } = requireConfigured(config);
  if (!config.payoutAuthToken?.trim()) throw new Error("PAYMENT_PAYOUT_NOT_CONFIGURED");
  const response = await fetch(`${baseUrl}/v1/payout`, { method: "POST", headers: { "x-api-key": apiKey, "x-pay-token": config.payoutAuthToken.trim(), "content-type": "application/json" }, body: JSON.stringify({ ipn_callback_url: input.ipnCallbackUrl, withdrawals: [{ address: input.address, currency: input.currency ?? NOWPAYMENTS_CURRENCY, amount: input.amount }] }) });
  if (!response.ok) throw new Error(`PAYMENT_PROVIDER_HTTP_${response.status}`);
  return response.json() as Promise<CreatePayoutResult>;
}

function sortIpnPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortIpnPayload);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortIpnPayload(item)]));
  return value;
}

export function verifyNowPaymentsIpn(rawBody: string, signature: string | undefined, secret: string | undefined) {
  if (!signature || !secret) return false;
  let canonicalBody: string;
  try {
    canonicalBody = JSON.stringify(sortIpnPayload(JSON.parse(rawBody)));
  } catch {
    return false;
  }
  const expected = createHmac("sha512", secret).update(canonicalBody).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export type NormalizedIpn = { providerEventId: string; paymentStatus: string; orderId?: string; currency?: string; network?: string; amount?: number; txHash?: string };

export function normalizeNowPaymentsIpn(payload: Record<string, unknown>): NormalizedIpn {
  const providerEventId = String(payload.payment_id ?? payload.id ?? payload.order_id ?? "").trim();
  if (!providerEventId) throw new Error("PAYMENT_PROVIDER_EVENT_ID_MISSING");
  const amount = Number(payload.actually_paid ?? payload.pay_amount ?? payload.price_amount);
  return { providerEventId, paymentStatus: String(payload.payment_status ?? "").trim().toLowerCase(), orderId: payload.order_id ? String(payload.order_id) : undefined, currency: payload.pay_currency ? String(payload.pay_currency).toUpperCase() : undefined, network: payload.network ? String(payload.network).toUpperCase() : undefined, amount: Number.isFinite(amount) ? amount : undefined, txHash: payload.payin_hash ? String(payload.payin_hash) : payload.outcome_tx_hash ? String(payload.outcome_tx_hash) : undefined };
}
