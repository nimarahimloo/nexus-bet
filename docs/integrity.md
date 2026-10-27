# Betting integrity: pricing, throttling, CSRF

Three P0 controls that sit between a request and the ledger. Each one fails
**closed**: if it cannot prove the request is safe, the request is refused.

---

## 1. Server-side pricing (`server/markets.ts`, `server/db/markets.ts`)

**Before:** `bet.place` accepted `selections[].odds` from the browser, multiplied
them, and stored the result as `potentialReturn`. A crafted POST could book a bet
at odds 1000.

**Now:** the browser's numbers are advisory only.

1. `syncSportsMarkets` writes the feed's 1X2 prices into `sportsMarkets`
   (`fixtureId + code` unique, price `decimal(8,4)`, `capturedAt`, `startsAt`,
   `matchStatus`).
2. `placeBet` resolves each selection id to `fixtureId + code`, loads the
   snapshot inside the bet transaction, and runs `checkMarketPrice`.
3. The ticket is priced with `priceTicket` from **server prices only**; the
   stored selections carry the server price too.

A selection is refused when:

| Reason                | Meaning                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `MARKET_UNAVAILABLE`  | No snapshot for that fixture/outcome, or a price ≤ 1                       |
| `MARKET_CLOSED`       | Kickoff passed, status is live/finished, or the row came from preview data |
| `ODDS_STALE`          | Snapshot older than 15 minutes                                             |
| `ODDS_CHANGED`        | Submitted price differs from the server price by more than 5%              |
| `ODDS_LIMIT_EXCEEDED` | Single price or combined odds above 1000                                   |

### The sync job is mandatory

```text
name:        nexus-sports-markets
cron:        0 */5 * * * *      # every 5 minutes, UTC, 6-field (seconds first)
path:        /api/scheduled/syncSportsMarkets
method:      POST
```

Without a running sync the book is empty and every bet is refused with
`MARKET_UNAVAILABLE`. That is deliberate — an empty price book must never mean
"accept whatever the client says".

`GET /api/health` already reports feed readiness; `POST` the job once by hand and
read `{ fixtures, markets, upserted }` to confirm it populated.

---

## 2. Throttling (`server/_core/rateLimit.ts`)

Fixed-window counters in MySQL (`rateLimits`), one row per bucket, so limits hold
across serverless instances and cold starts.

| Scope           | Key           | Budget     |
| --------------- | ------------- | ---------- |
| `login`         | ip + username | 5 / 5 min  |
| `signup`        | ip            | 3 / hour   |
| `reset-request` | ip            | 3 / hour   |
| `reset-submit`  | ip            | 5 / 15 min |
| `support-user`  | ip + user id  | 60 / hour  |
| `support-guest` | ip            | 5 / hour   |

Reset codes got their own hardening on top:

- A code is valid only when submitted **with the matching username** — a leaked
  code is useless against another account.
- Issuing a new code retires every previous unconsumed code for that account.
- Each wrong code burns one of 5 attempts on the token; at 5 the token is
  destroyed, so guessing cannot be spread across IPs.

`support.chat` is a paid inference call behind `publicProcedure`; the guest quota
is what stops it being a free LLM proxy. The check sits **outside** the handler's
try/catch so a limit error is never converted into a cheerful fallback reply.

---

## 3. CSRF (`server/_core/cookies.ts`, `server/_core/originGuard.ts`)

Two independent layers:

1. **Cookie** — session cookie is always `SameSite=Lax`. It was `None` on every
   non-local host, which attached the session to cross-site POSTs for no benefit:
   the app is a same-origin SPA.
2. **Origin** — `originGuard` mounted on `/api` rejects any state-changing request
   whose `Origin` does not match `Host` (plus hosts derived from `APP_PUBLIC_URL`).
   Requests with no `Origin` pass — cron, curl and the NOWPayments IPN
   authenticate by other means.

Smoke result on a live server:

```text
cross-origin POST /api/trpc/*  → 403 {"error":"CROSS_ORIGIN_BLOCKED"}
same-origin  POST /api/trpc/*  → 405 (guard passed)
cross-origin GET  /api/health  → 200 (reads unaffected)
no-Origin    POST /api/trpc/*  → 405 (cron/curl path intact)
```

---

## Migration

`drizzle/0017_p0_markets_and_rate_limits.sql` adds:

- `sportsMarkets` (unique `fixtureId + code`)
- `rateLimits` (primary key `bucketKey`)
- `passwordResetTokens.attempts` (default 0)

Apply with `npm run db:migrate` (or `db:push` for a fresh database). The
migration is additive; no existing row is rewritten.

## Known limits

- The price book keeps historical rows. They are harmless — anything older than
  15 minutes is refused as `ODDS_STALE` — but a periodic cleanup of fixtures
  older than a few days is worth adding.
- Limits are per IP, so a distributed attacker with many addresses still gets
  more attempts than one host. The per-token attempt counter is what closes the
  reset-code path in that case; login would benefit from a per-account counter
  as well.
- No CAPTCHA. If signup abuse appears, that is the next lever.
