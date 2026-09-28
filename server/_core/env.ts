export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  sportsApiKey: process.env.SPORTS_API_KEY ?? "",
  nowPaymentsApiKey: process.env.NOWPAYMENTS_API_KEY ?? "",
  nowPaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET ?? "",
  nowPaymentsPayoutWallet: process.env.NOWPAYMENTS_PAYOUT_WALLET_BEP20 ?? "",
  nowPaymentsPayoutAuthToken: process.env.NOWPAYMENTS_PAYOUT_AUTH_TOKEN ?? "",
  /** Public base URL of this deployment (no trailing slash), used for IPN callbacks. */
  appPublicUrl: process.env.APP_PUBLIC_URL ?? "",
};

/** Fail fast in production when critical secrets are missing (skip on Vercel if soft-boot). */
export function assertProductionEnv() {
  if (!ENV.isProduction) return;
  // On Vercel serverless, allow boot without DB so /api/health can report status.
  if (process.env.VERCEL === "1") {
    if (!ENV.cookieSecret.trim()) {
      console.warn("[env] JWT_SECRET missing on Vercel — auth cookies will not work");
    }
    if (!ENV.databaseUrl.trim()) {
      console.warn("[env] DATABASE_URL missing on Vercel — database features unavailable");
    }
    return;
  }
  const missing: string[] = [];
  if (!ENV.cookieSecret.trim()) missing.push("JWT_SECRET");
  if (!ENV.databaseUrl.trim()) missing.push("DATABASE_URL");
  if (missing.length) {
    throw new Error(`Production boot blocked: missing required env: ${missing.join(", ")}`);
  }
}
