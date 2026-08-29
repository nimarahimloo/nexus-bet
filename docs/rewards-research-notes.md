# Research notes: rewards, trust and responsible design

## Source 1
[RG — How to Use Sportsbook Rewards Programs, Responsibly](https://rg.org/guides/responsible-gambling/how-to-use-rewards-programs)

The source describes common reward-program patterns: points accumulation, tier levels, cashback/free bets, enhanced odds and clear terms. It also warns that rewards can encourage overbetting, create complex restrictions and shift attention from responsible play toward chasing points. The practical guardrails identified are a preset budget, understandable earning/redemption rules, visible value, activity monitoring and avoiding rewards that require disproportionate betting.

## Product implications for Nexus Bet

The product should not promise income or compensate losses in a way that encourages chasing. Safer activity rewards should be bounded, transparent and primarily tied to non-wager actions such as onboarding, learning responsible-play tools, profile completion and verified platform participation. Every random wheel segment should disclose label, probability or selection rule, daily limit, expiry and ledger entry. Wallet credits must be distinguishable from promotional balance and all reward changes must be auditable.

## Source 2
[NCPG — Responsible Gambling Resources for Sports Betting](https://www.ncpgambling.org/responsible-gambling/safer-sports-betting/)

NCPG frames safer sports betting around reducing harm and recommends comprehensive problem-gambling programs. Its cited review covers more than 140 studies on sports betting and gambling disorder. Product implications: trust requires visible limits, responsible-play education, access to support, and careful avoidance of mechanics that intensify chasing or overbetting. Nexus Bet should make budget/time limits and self-exclusion discoverable beside rewards rather than hiding them in account settings.

## Source 3
[BetMGM — How to Get the Most Out of Casino Loyalty Programs](https://casino.betmgm.com/en/blog/benefits-of-loyalty-programs-at-online-casinos/)

The example uses points, tiers and redemption choices, with explicit earning rates, qualifying actions, caps and expiry/policy considerations. It also states that rewards should complement activity the user would undertake anyway and be balanced against a preset affordable budget. Nexus Bet can borrow the clarity pattern—earning ledger, tier progress, caps and redemption rules—without copying wagering-linked incentives.

## Source 4
[Journal of Gambling Issues — Use of Gamification in Facilitating the Use of Responsible Gambling Tools](https://journals.sagepub.com/doi/10.1089/glr2.2019.2313)

The research direction is relevant to a safer product strategy: gamification can be used to encourage responsible-gambling-tool engagement. For Nexus Bet, points can be awarded for setting a budget, reviewing limits, completing education and taking a cooling-off break, rather than rewarding larger stakes or losses.

## Visual audit: mobile routes

The 390px review shows a coherent dark violet/cyan material system and strong Persian hierarchy, but repeated hero/card rhythms make pages feel templated. Some surfaces are equally luminous, weakening action/status hierarchy. The strongest design direction is to reserve electric violet for primary action and brand moments, cyan for live/verified/status signals, and deep graphite-purple for inactive surfaces. Each major route should have a distinct signature module: a market board for Matches, a secure treasury view for Wallet, a risk console for Crash, a prize ritual for Rewards and a control/identity surface for Account. The recurring visual motif should be connected neon nodes/orbit lines/crystalline network rather than generic casino decoration.

## Implementation review

The Rewards route now exposes six server-weighted segments with visible probabilities of 30%, 35%, 20%, 10%, 4% and 1%, plus a bounded daily check-in reward that does not require a wager. Direct browser review confirmed the route renders the new activity and odds sections. The Matches route renders the contextual AI strip and its existing real-data states. Guest state correctly hides account-specific activity data and asks the user to sign in.

## Contextual AI and visual follow-up review

Home and Matches both render the contextual Nexus AI strip above their primary content. The prompt is route-specific: platform overview on Home and live matches/filter help on Matches. The shared shell keeps the same header and navigation while route classes provide distinct accent treatment for matches, wallet, crash, rewards and account. Mobile-safe bottom spacing is applied on key subpages to prevent fixed navigation overlap.
