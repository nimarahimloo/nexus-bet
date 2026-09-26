# Go-live checklist — Nexus Bet

## What is already production-shaped in code

- Auth (local signup/login/reset), session cookies
- Wallet ledger (available / locked), multi-asset catalog
- Sports bets + Crash (seed-bound commit/reveal + public verifier)
- NOWPayments adapter: readiness gate, signed IPN, atomic settle with currency/network/amount checks
- Deposit creates provider payment + returns `payAddress`; withdrawal locks balance + creates payout when token set
- `/api/health` reports database + payments + sports config
- Production boot refuses empty `JWT_SECRET` / `DATABASE_URL`
- Data-truth fallbacks for sports without inventing live money

## Blockers only you can clear (secrets / accounts)

1. **MySQL** — provision DB, set `DATABASE_URL`, run `pnpm db:push`
2. **JWT_SECRET** — long random string in production env
3. **APP_PUBLIC_URL** — HTTPS origin of the live site (for IPN)
4. **NOWPayments** — account + KYB, then:
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`
   - `NOWPAYMENTS_PAYOUT_WALLET_BEP20`
   - `NOWPAYMENTS_PAYOUT_AUTH_TOKEN` (withdrawals)
   - Dashboard IPN URL: `{APP_PUBLIC_URL}/api/payments/nowpayments/ipn`
5. **SPORTS_API_KEY** — optional; without it Matches stay labeled «نمونه» / fallback
6. Host process with `pnpm build && pnpm start` (or equivalent) behind HTTPS

## Smoke after secrets

1. `GET /api/health` → `ok: true`, `payments.enabled: true` when keys present
2. Login → Wallet deposit small sandbox amount → provider address shown → IPN `finished` → balance increases once
3. Withdrawal small amount → locked → provider accept → locked released; failure restores available
4. Crash place + cashout + history «بررسی اثبات»
5. `pnpm test` and `pnpm check` green in CI/local

## Explicitly not claimed until secrets verified

- Real-money production readiness
- Live sports odds as `source=live`
- Social rooms / presence

See also `docs/nowpayments-provider-notes.md` and root `blueprint_execution.md`.
