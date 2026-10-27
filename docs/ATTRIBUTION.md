# Design attribution

## Horizon UI — MIT License

The design tokens in `client/src/ui-system.css` are taken from **Horizon UI**
(`horizon-ui/horizon-ui-chakra`), released under the MIT License:
<https://github.com/horizon-ui/horizon-ui-chakra>

Values adopted verbatim from its theme:

| Token | Value | Horizon name |
|---|---|---|
| Primary | `#422AFB` | `brand.500` |
| Accent (dark mode) | `#7551FF` | `brand.400` |
| Primary hover/press | `#3311DB` | `brand.600` |
| Brand tint | `#E9E3FF` | `brand.100` |
| Page background | `#0b1437` | `navy.900` |
| Card surface | `#111c44` | `navy.800` |
| Raised surface | `#1B254B` | `navy.700` |
| Muted text | `#A3AED0` | `secondaryGray.600` |
| Dim text | `#8F9BBA` | `secondaryGray.500` |
| Success | `#01B574` | `green.500` |
| Danger | `#EE5D50` | `red.500` |
| Warning | `#FFB547` | `orange.500` |
| Button radius | `16px` | `Button.baseStyle` |
| Card shadow | `45px 76px 113px 7px rgba(112,144,176,0.08)` | `Button.baseStyle` |

Only tokens were adopted — no Horizon components, pages or markup are copied.

## Deliberate deviations from the template

1. **`letter-spacing`** — Horizon sets `-0.5px` globally, tuned for DM Sans.
   Persian is a joined script and negative tracking breaks the connecting
   strokes, so the app keeps `letter-spacing: normal`.
2. **Font** — Horizon uses DM Sans, which has no Persian coverage. The app keeps
   Peyda / Kalameh and falls back to Vazirmatn.
3. **Primary is `brand.500` (`#422AFB`), not `brand.400`** — white text on
   `#7551FF` is 3.4:1 and fails WCAG AA; `#422AFB` gives 5.2:1. `#7551FF`
   remains the hover accent.
4. **`--ds-hero-art`** — the photographic hero was dropped in favour of
   Horizon's gradient treatment; the generated empty-state illustration is kept.
