# Blueprint execution map

| Domain | Current backend source | Current UI surface | Blueprint status | Next safe increment |
|---|---|---|---|---|
| Foundation | auth, wallets, bets, crash, NOWPayments settle path | auth modal, wallet, bet sheet, Crash | Code-complete for provider; **secrets still required** | Supply NOWPayments + APP_PUBLIC_URL + DB; sandbox smoke |
| Sports Core | sports feed adapters and details mapper | Matches, filters, details modal | Operational with truthful fallback | SPORTS_API_KEY for live source |
| Crash & Games | seed-bound rounds, wallet locks, public verifier | Crash page | Operational; restart-safe seed | Optional encrypt-at-rest for running seeds |
| Intelligence | smartPicks / support LLM | Home AI, support | Partially operational | Account-safe explanations only |
| Social | none | none | Deferred | Product + persistence decision |
| Loyalty | VIP, wheel, activity ledger | VIP, Rewards | Operational for ledger | Policy for real rewards only with provider |
| Trust | responsible play, source labels, health | shell + `/api/health` | Operational baseline | Ops logs as needed |
| Experience | shell, spacing, bottom sheets | main routes | Operational | Accessibility before gestures |

## Payment path (code ready)

1. `wallet.request` → ledger pending + NOWPayments payment/payout when credentials exist
2. IPN `/api/payments/nowpayments/ipn` verifies HMAC → atomic `settleWalletProviderTransaction`
3. Without credentials, mutations stay `SERVICE_UNAVAILABLE` (no fake pending money)

See `docs/GO_LIVE.md` and `.env.example`.

## Explicitly deferred

Social rooms, presence, private challenges, ZK fairness without product decision. Real-money claim only after sandbox verification.

## Active Heartbeat

| Job | Schedule | Callback | Task UID |
|---|---|---|---|
| `nexus-sport-alerts` | every 5 min UTC | `/api/scheduled/processSportAlerts` | `SCUcNJ4GCkw5nZwGtmFG4j` |
