# Sports bet settlement

How a pending ticket becomes `won`, `lost` or `void`, and how the money follows it.

## Pieces

| File | Responsibility |
|---|---|
| `server/settlement.ts` | Pure rules: which side a selection backs, per-leg outcome, ticket outcome, ledger arithmetic. No I/O. |
| `server/fixtureResults.ts` | API-Football `fixtures?id=` reader + status mapping. Every failure becomes `state: "unknown"`. |
| `server/db/settlement.ts` | `settlePendingSportsBets()` — reads pending tickets, resolves fixtures, applies the transition in a transaction. |
| `server/settlementWorker.ts` | `POST /api/scheduled/settleSportsBets`, cron-auth only, supports `dryRun`. |

## Rules (v1)

- **Markets:** only 1X2 (home / draw / away) is settleable. A selection is mapped by its id suffix (`۱`, `X`, `۲`, `1`, `2`) or, failing that, by the Persian market name (`برد میزبان` / `مساوی` / `برد مهمان`). Any other market stays `pending` — the system never guesses.
- **Accumulator:** one lost leg loses the ticket; otherwise a `void` leg refunds the whole ticket; every leg must win to win. (No partial-odds recalculation in v1 — that is a product decision, not a bug.)
- **Void sources:** the provider reports `PST`, `CANC`, `ABD`, `AWD`, `WO`. `SUSP` and unknown statuses stay `pending`.
- **Unresolved fixtures** (live, scheduled, API error, missing key) leave the ticket pending; it is retried on the next run.
- **Preview fixtures** (`preview-*`, `demo-*`) are never settled.
- **Money:**
  - `won` → `available += potentialReturn`, `locked -= stake`
  - `lost` → `locked -= stake`
  - `void` → `available += stake`, `locked -= stake`
  Each transition writes a `walletTransactions` row (`type = bet_settlement`, `referenceId = ticketCode`), a user notification, and releases the ticket in the same transaction.

## Idempotency

`applySettlement` first claims the ticket with `UPDATE bets SET status = ? WHERE id = ? AND status = 'pending'`. If zero rows change, the run skips it and moves no money. Overlapping cron ticks, retries and manual triggers therefore cannot pay a ticket twice. The wallet update is additionally guarded by `lockedBalance >= stake`; a mismatch rolls the transaction back and increments `failed` instead of corrupting the ledger.

## Cron

Register a heartbeat job in the platform (same mechanism as `nexus-sport-alerts`):

```text
name:        nexus-sports-settlement
cron:        0 */5 * * * *      # every 5 minutes, UTC, 6-field (seconds first)
path:        /api/scheduled/settleSportsBets
method:      POST
description: Settle pending sports tickets from API-Football final scores
```

Record the returned `taskUid` alongside the other heartbeat jobs in `blueprint_execution.md`.

## Operations

Dry run — reports what *would* settle, moves nothing:

```bash
curl -X POST "https://<host>/api/scheduled/settleSportsBets?dryRun=1&limit=200" \
  -H "Cookie: <cron session cookie>"
```

Response shape:

```json
{
  "ok": true,
  "dryRun": true,
  "sportsApiConfigured": true,
  "scanned": 12,
  "settledWon": 3,
  "settledLost": 7,
  "refundedVoid": 1,
  "stillPending": 1,
  "unresolvedFixtures": 0,
  "skipped": 0,
  "failed": 0,
  "decisions": [{ "ticketCode": "NX-AB12CD34EF56", "status": "won", "ledgerAmount": 21.5 }]
}
```

Read it like this:

- `stillPending` high + `unresolvedFixtures` high → the sports feed is unreachable or `SPORTS_API_KEY` is missing. Nothing is wrong with the tickets; fix the feed.
- `failed` > 0 → check server logs for `[Settlement] failed for <ticket>`; usually `LOCKED_BALANCE_MISMATCH`, which means a ticket was settled elsewhere or a wallet row was edited by hand.
- `skipped` > 0 → another worker won the race. Normal under overlapping runs.

## Known limits (deliberately out of scope)

1. **Odds are still client-supplied.** `bet.place` recomputes the combined odds from `selections[].odds` sent by the browser, so `potentialReturn` is only as trustworthy as that input. Settlement pays what the ticket recorded. Fixing this (server-side market price lookup) is P0-3 in the audit and should land before real money.
2. **Football only.** Fixtures are resolved through API-Football by id. Bets on the other sports in `SPORTS_DIRECTORY` (basketball, handball, hockey, volleyball, …) come from different providers with unrelated ids, so they resolve as `unknown` and stay pending. `SettlePendingOptions.resolveFixture` is the injection point for a per-sport resolver; nothing else needs to change.
3. **No cash-out, no partial settlement, no manual override UI.** A disputed ticket is currently adjusted by hand in the DB.
4. **Serialised per-ticket transactions.** Fine at hundreds of tickets per run; above that, batch the wallet updates per user.
