# Go-live checklist — Nexus Bet

## What is already production-shaped in code

- Auth (local signup/login/reset), session cookies
- Wallet ledger (available / locked), multi-asset catalog
- Sports bets + Crash (seed-bound commit/reveal + public verifier)
- Sports bet settlement worker (`/api/scheduled/settleSportsBets`): 1X2 result mapping, idempotent ledger transition, void refund, `dryRun` — see `docs/settlement.md`
- Server-side pricing (`sportsMarkets` + `bet.place`): odds are read from the server book, never from the request — see `docs/integrity.md`
- Auth throttling (`rateLimits`), reset codes bound to a username with a 5-attempt budget, `support.chat` guest quota
- CSRF: `SameSite=Lax` session cookie + Origin guard on `/api` mutations
- NOWPayments adapter: readiness gate, signed IPN, atomic settle with currency/network/amount checks
- Deposit creates provider payment + returns `payAddress`; withdrawal locks balance + creates payout when token set
- `/api/health` reports database + payments + sports config
- Production boot refuses empty `JWT_SECRET` / `DATABASE_URL`
- Data-truth fallbacks for sports without inventing live money

## Blockers only you can clear (secrets / accounts)

1. **MySQL** — provision DB, set `DATABASE_URL`, run `npm run db:push`
2. **JWT_SECRET** — long random string in production env
3. **APP_PUBLIC_URL** — HTTPS origin of the live site (for IPN)
4. **NOWPayments** — account + KYB, then:
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`
   - `NOWPAYMENTS_PAYOUT_WALLET_BEP20`
   - `NOWPAYMENTS_PAYOUT_AUTH_TOKEN` (withdrawals)
   - Dashboard IPN URL: `{APP_PUBLIC_URL}/api/payments/nowpayments/ipn`
5. **SPORTS_API_KEY** — optional; without it Matches stay labeled «نمونه» / fallback
6. Host process with `npm run build && npm start` (or equivalent) behind HTTPS
7. **Settlement cron** — register the `nexus-sports-settlement` heartbeat job (every 5 min, UTC) against `POST /api/scheduled/settleSportsBets`; without it, tickets stay `pending` forever. See `docs/settlement.md`.
8. **Market sync cron** — register the `nexus-sports-markets` heartbeat job (every 5 min, UTC) against `POST /api/scheduled/syncSportsMarkets`; without it the price book is empty and every bet is refused with `MARKET_UNAVAILABLE`. See `docs/integrity.md`.
9. **Migrations** — apply `drizzle/0017_p0_markets_and_rate_limits.sql` (`npm run db:migrate`) before deploying this build.

## Smoke after secrets

1. `GET /api/health` → `ok: true`, `payments.enabled: true` when keys present
2. Login → Wallet deposit small sandbox amount → provider address shown → IPN `finished` → balance increases once
3. Withdrawal small amount → locked → provider accept → locked released; failure restores available
4. Crash place + cashout + history «بررسی اثبات»
5. Market sync: `POST /api/scheduled/syncSportsMarkets` → `{ fixtures > 0, markets > 0 }`; then place a bet and confirm the stored `combinedOdds` matches the server book, and that editing the odds in devtools is rejected with `ODDS_CHANGED`
6. Settlement: place a small bet on a finished fixture → `dryRun=1` reports it → real run settles it once, locked balance drops and `available` moves exactly once → bet history shows برنده/بازنده/بازگشت وجه
7. `pnpm test` and `pnpm check` green in CI/local
5. Settlement: place a small bet on a finished fixture → `dryRun=1` reports it → real run settles it once, locked balance drops and `available` moves exactly once → bet history shows برنده/بازنده/بازگشت وجه
5. `pnpm test` and `pnpm check` green in CI/local
5. Market sync: `POST /api/scheduled/syncSportsMarkets` → `{ fixtures > 0, markets > 0 }`; then place a bet and confirm the stored `combinedOdds` matches the server book, and that editing the odds in devtools is rejected with `ODDS_CHANGED`
6. Settlement: place a small bet on a finished fixture → `dryRun=1` reports it → real run settles it once, locked balance drops and `available` moves exactly once → bet history shows برنده/بازنده/بازگشت وجه
7. `npm test` and `npm run check` green in CI/local

## Explicitly not claimed until secrets verified

- Real-money production readiness
- Live sports odds as `source=live`
- Social rooms / presence

See also `docs/nowpayments-provider-notes.md` and root `blueprint_execution.md`.
