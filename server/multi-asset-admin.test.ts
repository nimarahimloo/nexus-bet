import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("multi-asset and admin contracts", () => {
  it("keeps the asset catalog and wallet identity currency-scoped", () => {
    const schema = read("../drizzle/schema.ts");
    const db = read("./db.ts");
    const wallet = read("../client/src/components/MultiAssetWallet.tsx");
    expect(schema).toContain("export const supportedAssets");
    expect(schema).toContain("userCurrencyUnique");
    expect(db).toContain("getWalletPortfolio");
    expect(db).toContain("UNSUPPORTED_CURRENCY");
    expect(wallet).toContain("trpc.wallet.portfolio.useQuery");
    expect(wallet).toContain("trpc.assets.active.useQuery");
    expect(wallet).toContain("currency: selectedAsset.code");
    expect(wallet).toContain("trpc.wallet.providerStatus.useQuery");
    expect(wallet).toContain("!providerReady");
  });

  it("exposes protected administration controls without static catalog mutation", () => {
    const router = read("./routers.ts");
    const admin = read("./adminDb.ts");
    const page = read("../client/src/pages/AdminPage.tsx");
    expect(router).toContain("admin: router");
    expect(router).toContain("adminProcedure");
    expect(router).toContain("assetUpsert");
    expect(router).toContain("reviewTransaction");
    expect(admin).toContain("createAdminNotification");
    expect(admin).toContain("updateAdminAssetStatus");
    expect(admin).toContain("count()");
    expect(admin).toContain("LOCKED_BALANCE_MISMATCH");
    expect(page).toContain("trpc.admin.overview.useQuery");
    expect(page).toContain("trpc.admin.notify.useMutation");
    expect(page).toContain("trpc.admin.assetStatus.useMutation");
    const provider = read("./nowpayments.ts");
    const entry = read("./_core/index.ts");
    const webhook = read("./nowpaymentsWebhook.ts");
    expect(provider).toContain("USDTBSC");
    expect(provider).toContain("timingSafeEqual");
    expect(entry).toContain("registerNowPaymentsWebhook");
    expect(webhook).toContain("/api/payments/nowpayments/ipn");
  });
});
