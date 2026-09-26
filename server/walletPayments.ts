import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { attachWalletProviderTransaction, requestWalletTransaction } from "./db";
import {
  NOWPAYMENTS_NETWORK,
  NOWPAYMENTS_PROVIDER,
  createNowPaymentsPayment,
  createNowPaymentsPayout,
  nowPaymentsReadiness,
} from "./nowpayments";

export function paymentProviderConfig() {
  return {
    apiKey: ENV.nowPaymentsApiKey,
    ipnSecret: ENV.nowPaymentsIpnSecret,
    payoutWallet: ENV.nowPaymentsPayoutWallet,
    payoutAuthToken: ENV.nowPaymentsPayoutAuthToken,
  };
}

function paymentIpnUrl() {
  const base = (ENV.appPublicUrl || "").replace(/\/$/, "");
  if (!base) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "آدرس عمومی سرور (APP_PUBLIC_URL) برای callback پرداخت تنظیم نشده است.",
    });
  }
  return `${base}/api/payments/nowpayments/ipn`;
}

export type WalletRequestInput = {
  userId: number;
  type: "deposit" | "withdrawal";
  currency: string;
  amount: number;
  network?: string;
  address?: string;
};

/** Create ledger row + provider payment/payout. Rejects when credentials missing. */
export async function executeWalletProviderRequest(input: WalletRequestInput) {
  const config = paymentProviderConfig();
  const readiness = nowPaymentsReadiness(config);
  if (!readiness.enabled) {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "provider پرداخت هنوز تنظیم نشده است." });
  }
  if (input.type === "withdrawal" && !readiness.payoutEnabled) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "برداشت هنوز پیکربندی نشده است (توکن payout لازم است).",
    });
  }
  if (input.type === "withdrawal" && !input.address?.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "آدرس کیف پول مقصد برای برداشت الزامی است." });
  }

  let ledger: Awaited<ReturnType<typeof requestWalletTransaction>>;
  try {
    ledger = await requestWalletTransaction({
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      network: input.network ?? NOWPAYMENTS_NETWORK,
      address: input.address,
    });
  } catch (error) {
    const code = String(error);
    if (code.includes("INSUFFICIENT_BALANCE")) throw new TRPCError({ code: "BAD_REQUEST", message: "موجودی قابل‌استفاده کافی نیست." });
    if (code.includes("UNSUPPORTED_CURRENCY")) throw new TRPCError({ code: "BAD_REQUEST", message: "این دارایی پشتیبانی نمی‌شود." });
    if (code.includes("WITHDRAWAL_ADDRESS_REQUIRED")) throw new TRPCError({ code: "BAD_REQUEST", message: "آدرس کیف پول مقصد برای برداشت الزامی است." });
    if (code.includes("DATABASE_UNAVAILABLE")) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "دیتابیس موقتاً در دسترس نیست." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ثبت درخواست کیف پول ممکن نشد." });
  }

  const ipnCallbackUrl = paymentIpnUrl();
  try {
    if (input.type === "deposit") {
      const payment = await createNowPaymentsPayment(config, {
        priceAmount: input.amount,
        priceCurrency: "usd",
        orderId: ledger.orderId,
        orderDescription: `Nexus Bet deposit ${ledger.orderId}`,
        ipnCallbackUrl,
      });
      const providerEventId = String(payment.payment_id ?? "").trim();
      if (!providerEventId) throw new Error("PAYMENT_PROVIDER_ID_MISSING");
      await attachWalletProviderTransaction({
        transactionId: ledger.id,
        provider: NOWPAYMENTS_PROVIDER,
        providerEventId,
        providerStatus: String(payment.payment_status ?? "waiting"),
        payloadJson: JSON.stringify(payment),
      });
      return {
        ...ledger,
        provider: NOWPAYMENTS_PROVIDER,
        providerEventId,
        payAddress: payment.pay_address ?? null,
        payAmount: payment.pay_amount != null ? Number(payment.pay_amount) : null,
        payCurrency: payment.pay_currency ?? null,
        network: NOWPAYMENTS_NETWORK,
      };
    }

    const payout = await createNowPaymentsPayout(config, {
      address: input.address!.trim(),
      amount: input.amount,
      ipnCallbackUrl,
    });
    const providerEventId = String(payout.withdrawals?.[0]?.id ?? payout.id ?? payout.batch_withdrawal_id ?? "").trim();
    if (!providerEventId) throw new Error("PAYMENT_PROVIDER_ID_MISSING");
    await attachWalletProviderTransaction({
      transactionId: ledger.id,
      provider: NOWPAYMENTS_PROVIDER,
      providerEventId,
      providerStatus: String(payout.withdrawals?.[0]?.status ?? payout.status ?? "pending"),
      payloadJson: JSON.stringify(payout),
    });
    return {
      ...ledger,
      provider: NOWPAYMENTS_PROVIDER,
      providerEventId,
      payAddress: input.address!.trim(),
      payAmount: input.amount,
      payCurrency: "USDTBSC",
      network: NOWPAYMENTS_NETWORK,
    };
  } catch (error) {
    console.error("[wallet.request] provider call failed", error);
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "ارتباط با provider پرداخت برقرار نشد. درخواست در وضعیت pending باقی ماند؛ پشتیبانی را مطلع کن.",
    });
  }
}
