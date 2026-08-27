# Nexus Bet — Platform data and UI audit

## Findings

| Area | Current source | Risk | Cleanup direction |
|---|---|---|---|
| Sports fixtures/live | API-Football with fallback | Real fixtures map to empty markets, so UI reintroduces demo odds | Add a real odds/markets provider contract; never expose demo odds as real |
| Match details | API-Football details with demo fallback | Acceptable only when source/error is explicit | Keep source/error visible in details modal |
| Bets/wallet | `wallet.me` and `bet.place` backend contracts | Core path is real, but Home still has a separate optimistic confirmation path | Use one bet placement contract and invalidate wallet/bets after success |
| Home wallet/deposit | Hardcoded network addresses, fees and sample balance in parts of Home | Users may mistake placeholder payment data for a real deposit route | Replace with backend wallet/deposit status; show unavailable until connected |
| AI | Backend `ai.smartPicks` exists, but supporting AI page has static picks | Static picks look like live recommendations | Feed AI page from sports query and label fallback explicitly |
| Bonuses/tournaments | Hardcoded sample islands | Not operational data | Keep as clearly marked preview until backend contracts exist |
| VIP/account | Fixed score, balances and open-bet copy | Looks like user-specific data without source | Bind to authenticated queries or render empty/unavailable states |
| Crash | Fully simulated local game | Safe only when explicitly labeled demo | Keep isolated as demo; do not present it as a real money game |
| Headers | Home custom header plus `PageShell` header | Two visual systems and duplicated navigation | Move Home to one shared shell/header |
| Bottom sheets | Home slip, Matches prediction sheet, ticket modal | Multiple interaction models and duplicate actions | Create one shared mobile bet sheet; use dialog only for details/confirmation |

## First refactor boundary

The first production cleanup should target the core navigation and sportsbook path: one shared header, one shared mobile betting sheet, API-backed fixture/odds contracts, and no hardcoded wallet/account values in operational surfaces. Preview-only pages remain available but must carry a visible preview state until their backend contracts are implemented.
