# Sports provider notes

Source: [API-Sports](https://api-sports.io/) and [API-Basketball documentation](https://api-sports.io/documentation/basketball/v1), accessed 2026-09-01.

API-Sports publicly lists Football, AFL, Baseball, Basketball, Formula-1, Handball, Hockey, MMA, NBA, NFL & NCAA, Rugby and Volleyball as available sports. The Basketball documentation identifies the base URL `https://v1.basketball.api-sports.io/`, GET-only requests, the `x-apisports-key` header, and a `games` endpoint. The provider also states that logos/images are available for identification but may carry third-party rights obligations; Nexus Bet therefore renders only URLs returned by the backend and does not fabricate team logos.

Implementation decision: Nexus Bet keeps the existing Football adapter and adds a best-effort multi-sport universe adapter for the listed API-Sports game APIs. If a sport endpoint is unavailable, rate-limited or returns no mappable identity, the UI does not invent odds or team data; it reports the provider state and retains the explicit preview fallback only where already configured.
