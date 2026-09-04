# Blueprint execution map

| Domain | Current backend source | Current UI surface | Blueprint status | Next safe increment |
|---|---|---|---|---|
| Foundation | auth, wallets, bets, crash rounds, wallet transactions | auth modal, wallet, bet sheet, Crash | Partially operational | NOWPayments credentials and sandbox verification |
| Sports Core | sports feed adapters and details mapper | Matches, filters, details modal | Operational with truthful fallback | Extend match-scoped insights and watchlist only when persistence is added |
| Crash & Games | crash round/bet lifecycle, wallet locks, settlement | Crash page | Operational; transparent proof added for new rounds | Add public verifier UX and server-side lifecycle tests |
| Intelligence | smartPicks and support chat through internal LLM | Home AI picks, AI page, support widget, match modal | Partially operational | Add account-safe bankroll explanations; never present guaranteed outcomes |
| Social | no persistent rooms/challenges/presence model | none | Not started | Requires product rules, moderation, privacy, and real-time backend decision |
| Loyalty | VIP activity, reward wheel, activity ledger | VIP, Rewards | Operational for existing ledger | Add streak/achievement only with explicit ledger schema and policy |
| Trust | responsible play and source labels | shared shell and route states | Partially operational | Add proof verifier and audit trail, not decorative trust copy |
| Experience | shared shell, responsive spacing, bottom sheets | all main routes | Operational baseline | Add gesture interactions only after preserving keyboard/accessibility paths |

## Data model decisions

مسابقات، odds، موجودی، bet، round و تراکنش فقط از backend یا provider مجاز وارد UI می‌شوند. presence، social rooms، alerts و private challenges تا زمان تعریف persistence و privacy policy نباید با شمارنده یا دادهٔ نمونه شبیه‌سازی شوند. برای Crashهای جدید `serverSeedHash` قبل از شروع commit و `serverSeed` پس از پایان reveal می‌شود؛ ستون‌ها برای roundهای legacy nullable هستند تا migration مخرب نباشد.

## Dependency order

اول Foundation و صحت ledger، سپس sports/crash data contracts، سپس intelligence و در ادامه social/loyalty enhancements. هر قابلیت پرداختی به credential امن و sandbox smoke وابسته است. هر قابلیت social به مدل داده، authorization، rate-limit، moderation و تصمیم محصول دربارهٔ real-time transport وابسته است.

## Explicitly deferred items

فعال‌سازی invoice/payout و settlement واقعی NOWPayments بدون secrets پذیرفته‌شده انجام نمی‌شود. Social Prediction Rooms، presence، private challenges، watchlist alerts و ZK fairness در این iteration به‌صورت mock یا local-only ساخته نمی‌شوند؛ ابتدا قرارداد محصول و زیرساخت آن‌ها باید تصویب شود.


## Active Heartbeat

| Job | Schedule | Callback | Task UID |
|---|---|---|---|
| `nexus-sport-alerts` | هر ۵ دقیقه، UTC | `/api/scheduled/processSportAlerts` | `SCUcNJ4GCkw5nZwGtmFG4j` |

این job فقط اعلان‌های kickoff مربوط به مسابقات واقعی ذخیره‌شده در Watchlist را پردازش می‌کند. fixtureهای preview و دادهٔ ساختگی وارد inbox نمی‌شوند.
