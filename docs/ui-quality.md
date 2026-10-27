# UI quality pass — responsive contract, defects fixed, QA matrix

Companion to `docs/design-betfa.md` (visual language). This one covers layout
integrity, interaction states and cross-viewport behaviour.

## Defects found and fixed

| #   | Defect                                                                              | Why it mattered                                                                                                                                                                                                                                                                                                                                                   | Fix                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Four CSS lines began with a stray `+` (`index.css:92,93,202,203`)                   | The `+` makes the at-rule invalid, so the whole block was dropped by the parser. Two `@keyframes` were dead **and** the entire phone block for `.subpage-hero`, `.standalone-grid`, `.crash-grid`, `.vip-level`, `.crash-actions` and `.mobile-bottom-nav { display:flex }` never applied — subpages stayed two-column and crash actions never stacked on phones. | Stripped the prefixes; verified brace balance in all 11 stylesheets.                                                                            |
| 2   | Stacking inversion: bottom dock `z-index:43`, bet sheet `40`, support launcher `42` | The dock painted **over** the open bet sheet and the support bubble floated above modals.                                                                                                                                                                                                                                                                         | One documented scale: dock 30 → launcher 31 → sheet 60 → modal 70 → support 80 → toast 100.                                                     |
| 3   | Form controls at 9–10px                                                             | Unreadable, and any control under 16px makes iOS zoom the viewport on focus — the classic "form feels broken on mobile".                                                                                                                                                                                                                                          | 16px on ≤720px, 15px above; min-height 44/42px; labels and validation text raised to 12px.                                                      |
| 4   | No tablet band (721–1023)                                                           | That range inherited desktop rules written for ≥1024: two-column hero, 292–340px sidebar, rotated hero card. Cramped on iPad portrait.                                                                                                                                                                                                                            | New band: single-column hero, 280/268px sidebar, non-sticky slip, tighter odds gap, container capped at 960px.                                  |
| 5   | Support launcher pinned `bottom:22px; left:22px`                                    | Sat on top of the bottom dock on every phone.                                                                                                                                                                                                                                                                                                                     | Raised to `calc(88px + safe-area)` and left-aligned to 12px on ≤720px.                                                                          |
| 6   | Hover styles fire on touch                                                          | Tapping a card leaves it lifted/highlighted until the next tap.                                                                                                                                                                                                                                                                                                   | `@media (hover:none)` neutralises lift and border changes; `touch-action: manipulation` removes the 300ms delay.                                |
| 7   | Page scrolled behind open sheets                                                    | Dragging the sheet moved the page underneath.                                                                                                                                                                                                                                                                                                                     | `body:has(...)` scroll lock for sheet/modal/support layers.                                                                                     |
| 8   | Rotated hero card (`rotate(-1.5deg)`) at phone widths                               | Overflowed the viewport edge and clipped its own content.                                                                                                                                                                                                                                                                                                         | Rotation reset at ≤720px (kept on desktop where it has room).                                                                                   |
| 9   | Long team names / wide grids pushed the viewport                                    | Grid and flex children default to `min-width:auto`; `overflow-x: hidden` was missing, so the whole page drifted sideways.                                                                                                                                                                                                                                         | `overflow-x: clip` (keeps `position: sticky` working, unlike `hidden`), `min-width:0` on grid children, `overflow-wrap:anywhere` on team names. |
| 10  | Focus ring inconsistent (21 rules in 3 files)                                       | Keyboard users lost the cursor position on many controls.                                                                                                                                                                                                                                                                                                         | Global `:focus-visible` ring in brand yellow on every interactive element.                                                                      |

## Responsive contract

| Range      | Layout                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ≤380px     | Single column, container inset 12px, hero type 1.55rem, compact cards, 3-up odds retained                                           |
| 381–720px  | Single column, container capped at 560px, docked bottom nav (44px targets), floating slip trigger above the dock, sheets full-width |
| 721–1023px | Single-column hero, sidebar 268–280px, non-sticky slip, container capped 960px                                                      |
| ≥1024px    | Two-column hero, sticky slip, container capped 1180px                                                                               |

## QA matrix — verify before release

Run at **390×844 (phone)**, **834×1112 (tablet portrait)**, **1440×900 (desktop)**.

| Surface          | Checks                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Home             | no horizontal scroll; hero readable; odds buttons ≥44px tall and 3-up at every width; bottom nav clears the last card              |
| Matches          | filter chips wrap without overflow; selected odds state legible (black on yellow); slip sticky on desktop, docked trigger on phone |
| Crash            | actions stack on phone (`flex-direction: column-reverse`), no clipped multiplier                                                   |
| Bet slip         | opens above dock; page behind does not scroll; submit disabled state visible; safe-area padding on iPhone                          |
| Auth modal       | inputs 16px on phone (no zoom on focus); error text readable; tab order lands on the first field                                   |
| Wallet / Account | amount columns align; long currency labels do not wrap the row                                                                     |
| Admin            | tables scroll horizontally inside their container, not the page                                                                    |
| All              | focus ring visible via Tab; no hover-only affordance on touch; reduced-motion honoured                                             |

## Verification limit

There is no browser in this environment, so this pass is verified by
`tsc --noEmit`, `vite build`, the 168-test suite and static CSS analysis —
**not** by rendered screenshots. The QA matrix above is what a human must
confirm. Two things I could not assert: real header height (so the sticky slip
offset stays at the existing 79px) and whether any sub-11px text in the dense
admin tables reflows at 390px.
