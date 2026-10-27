# Nexus Bet

Persian-first sportsbook and crash-game platform: React 19 + Vite client, Express + tRPC API,
Drizzle/MySQL ledger.

## Stack

| Layer  | Choice                                                                           |
| ------ | -------------------------------------------------------------------------------- |
| Client | React 19, Vite 7, Tailwind 4, wouter routing, tRPC client                        |
| Server | Express 4, tRPC 11, Drizzle ORM, MySQL                                           |
| Money  | `decimal(20,6)` columns, atomic conditional updates, one ledger row per movement |
| Tests  | Vitest (unit + contract), Cypress (e2e)                                          |
| Deploy | Long-running Node process behind HTTPS, or serverless via `api/index.ts`         |

## Quickstart

```bash
cp .env.example .env      # fill DATABASE_URL and JWT_SECRET at minimum
npm ci                    # reproducible install (lockfile is committed)
npm run db:push           # create schema
npm run dev               # http://localhost:3000
```

First admin (there is no seeded account, by design):

```bash
npm run admin:promote -- your-username
```

## Scripts

| Script                                | Purpose                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                         | Vite + API with hot reload                                    |
| `npm run build`                       | Client bundle + server bundle into `dist/`                    |
| `npm start`                           | Production server from `dist/index.js`                        |
| `npm run check`                       | `tsc --noEmit`                                                |
| `npm test`                            | Vitest suite                                                  |
| `npm run test:e2e`                    | Cypress                                                       |
| `npm run db:push` / `db:migrate`      | Apply schema / pending migrations                             |
| `npm run admin:promote -- <username>` | Grant the admin role to an existing user                      |
| `npm ci`                              | Reproducible install from the committed lockfile (used by CI) |

## Environment

Required in production: `DATABASE_URL`, `JWT_SECRET`, `APP_PUBLIC_URL`. `SPORTS_API_KEY` is
optional but without it the app labels fixtures as preview data and **bet placement fails
closed** (no price book). Payment keys (`NOWPAYMENTS_*`) are only needed for deposits and
payouts. Full list with comments: `.env.example`.

Production boot refuses empty `JWT_SECRET` / `DATABASE_URL`.

## Background jobs

Two cron jobs are required. Both are `POST`, cron-authenticated, and safe to re-run.

| Job            | Path                               | Schedule    | Without it                                                           |
| -------------- | ---------------------------------- | ----------- | -------------------------------------------------------------------- |
| Market sync    | `/api/scheduled/syncSportsMarkets` | every 5 min | price book stays empty → every bet refused with `MARKET_UNAVAILABLE` |
| Bet settlement | `/api/scheduled/settleSportsBets`  | every 5 min | tickets sit `pending` forever and stake stays locked                 |

`settleSportsBets` supports `?dryRun=1` to report decisions without moving money, and
`?limit=` (max 500). Details: [`docs/settlement.md`](docs/settlement.md).
Sport alerts run on `/api/scheduled/processSportAlerts`.

## Operations

- `GET /api/health` → `200` with `{ ok: true, database: "up", sports, uptimeSeconds }`, or
  `503` when a `SELECT 1` fails. It is a real probe, not a constant.
- Ledger invariants: bets move `available → locked` on placement; settlement credits
  `potentialReturn` on a win, releases the stake on a loss, refunds on a void. Every path is
  a single transaction guarded by a status claim, so re-runs cannot double-pay.
- `lockedBalance` can never go negative: settlement and crash-out both require
  `lockedBalance >= stake` or the transaction rolls back.

## Security posture

- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` when served over HTTPS.
- CSRF: `SameSite=Lax` plus an `Origin`/`Host` guard on `/api` mutations.
- Auth throttling in MySQL: login 5/5min (ip+username), signup 3/h, reset 3/h + 5 per token.
- Reset codes are bound to a username, single-use, 15-minute TTL, 5 attempts.
- Betting is priced server-side from `sportsMarkets`; client-supplied odds are advisory and
  rejected when they drift more than 5%.
- Passwords: scrypt with per-user salt, `timingSafeEqual` verification.

Details: [`docs/integrity.md`](docs/integrity.md).

## Deployment notes

1. Apply migrations (`npm run db:migrate`) before starting the new build.
2. Point the NOWPayments IPN URL at `{APP_PUBLIC_URL}/api/payments/nowpayments/ipn`.
3. Register both cron jobs above.
4. Run `npm run build && npm start` behind a TLS-terminating proxy.
5. Verify `GET /api/health` returns `200`.

### Two supported deploy shapes

**Long-running Node (recommended).** `npm run build && npm start` behind a TLS proxy. One
process serves the SPA and the API, and external cron `POST`s the two scheduled routes.

**Vercel.** `api/[...path].ts` is a catch-all function that hands the untouched URL to the
same Express app, and `vercel.json` rewrites everything else to `index.html` for client-side
routing. Keep the `(?!api/)` guard in that rewrite — without it the SPA rewrite will swallow
API paths. Serverless does not keep a scheduler alive, so both cron jobs still need an
external trigger (Vercel Cron or any scheduler that can send the cron credentials).

The previous config rewrote `/api/:path*` to `/api`, which discarded the subpath before the
function ran; every route except the bare `/api` returned 404. That rewrite is gone.

## Known limits (not hidden, just not done)

- Sports settlement covers football 1X2. Other sports resolve as `unknown` and stay pending.
- No cash-out or manual settlement override UI for sports bets.
- Rate limits are per IP; a distributed attacker gets more login attempts than one host.
- No CSP header yet — needs verification against the real bundle before it is safe to enable.
- The price book keeps historical rows; stale ones are refused, not deleted.

## Repo layout

```text
client/src/     React app (pages, components, ui-*.css design system)
server/         Express + tRPC routers, db layer, workers
shared/         Types and constants used by both sides
drizzle/        Schema + SQL migrations
docs/           settlement, integrity, go-live checklists
scripts/        Operational one-offs (admin bootstrap)
api/index.ts    Serverless entry point
```
