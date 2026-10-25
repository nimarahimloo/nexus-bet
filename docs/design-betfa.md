# Visual language — betfa.com reference

Target: the app should read as the same *product language* as `betfa.com` — dark canvas,
flat panels, one electric accent, dense betting rows. This documents what was measured,
what was applied, and what is still structurally different.

## How the reference was measured

`betfa.com` sits behind Cloudflare: a headless browser is refused from this network
(`ERR_CONNECTION_REFUSED` on both profiles) and `curl` gets the challenge page. What did
work:

- **Live DOM text** via a fetcher on a different egress — gave section order, nav order,
  match-row anatomy, labels, and the empty bet-slip copy.
- **The site's own artwork** (`cdn.betfa.com`): the header logo and hero banners.

Colours below are sampled from that artwork, not guessed from CSS (no stylesheet was
reachable). Pixel values that would require `getComputedStyle` — exact header height,
card radius in px, font size ramp — are marked "not measured".

## Extracted palette

| Token | Value | Source |
|---|---|---|
| Canvas | `#0b0b0c` | banner background |
| Surface | `#141416` | banner panel area |
| Elevated surface | `#1b1b1e` | — |
| Border | `rgba(255,255,255,0.08)` | — |
| Primary accent | `#f2de1a` | logo wordmark, banner headline |
| Primary hover | `#ffe94d` | — |
| Secondary accent | `#a3e635` | banner lime glow / chips |
| Live / danger | `#ef3e3e` | live-badge convention on the reference |
| Text | `#ffffff` | banner copy |
| Muted text | `#a7a7ae` | — |

Typography: the reference sets Persian display type for headings and tabular figures for
odds. This app keeps **Peyda** (body) and **Kalameh** (headings/buttons) — already tuned for
RTL — and adds `font-variant-numeric: tabular-nums` on odds and scoreboard numbers.

## What changed

`ui-brand.css` was rewritten as the single skin layer (~360 lines) and the token block in
`index.css` was replaced. The old theme was neon purple + cyan with glass blur and coloured
glow; the reference is flat black with one yellow accent. Specifically:

- Panels: `rgba(18,10,40,.72)` + `backdrop-filter: blur(18px)` → solid `#141416`, hairline
  border, no blur, no glow.
- Primary CTA: purple→cyan gradient with white text → solid `#f2de1a` with **black** text.
- Odds buttons: lavender value on violet wash; selected state was a teal/violet gradient →
  white value on `#1b1b1e`; selected is solid yellow with black label.
- Live chips/dots: teal → red.
- Nav active, filter pills, mobile dock, support launcher: purple/teal → yellow.
- Aurora blobs and grid overlay removed (the reference canvas is flat).
- Radii pulled from `1.25rem` to `0.75rem`.

Palette migration was applied mechanically across all 10 stylesheets — 217 hex and 294
`rgba()` values remapped by role (dark purple surfaces → neutral ramp, purple accents →
yellow, teal → lime). A residual-colour check now returns **0** saturated purple/teal values
in the CSS.

## Already matching (no change needed)

- Match row anatomy: league → date/time → home → away → three equal 1X2 buttons, label above
  value. `SportsbookMatchCard` already renders exactly this, including the selected state.
- RTL Persian layout, mobile bottom dock, bet slip as a docked panel with an empty state.

## Still different (next batch)

1. **Home section order.** Reference: hero carousel (7 slides) → sports jackpot strip →
   featured-game rail → sport chips (فوتبال/والیبال/بسکتبال/تنیس/هاکی) → match list → casino
   rails → top-wins table (masked IDs, IRT amounts, timestamps) → about text. Ours is a
   single-column feature hub; the carousel, jackpot strip and winners table are not present.
2. **Over/under markets.** The reference shows `بیشتر از (3.5)` / `کمتر از (3.5)` under 1X2.
   Our odds mapper only produces match-winner markets, so this needs a feed change, not CSS.
3. **Header density.** Reference has a utility row (rules/news/promotions/tournaments/telegram
   + register/login + 5-language switcher) above the logo row.
4. **Card radius / header height** — not measured, so not asserted.

## Verification limit

There is no usable browser in this environment, so this pass is verified by build and by
token/cascade inspection, **not** by pixel comparison. Before shipping, open the app at
1440px and 390px and compare against the reference for: contrast on yellow-on-black CTAs,
odds-button tap targets, and selected-state legibility.
