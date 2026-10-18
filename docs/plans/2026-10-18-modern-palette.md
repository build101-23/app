# A more modern palette

Status: **adopted** ([ADR 0031](../adr/0031-cleaner-neutral-palette.md)). Previewed locally first, then adopted at the user's word.

## Context
The neutrals read as sage-grey: a green-tinted ground, grey-green chips and skeletons, and a green-black dark theme. That's the "wellness" look [design.md](../design.md#overview) says the app avoids. The brand colors can't move: green dots, the deep green (the app icon tile) and the tangerine apex are in the approved logo and icons.

So the palette lever is the neutrals and the dark theme, with the brand colors untouched.

## Approach
Tokens only, in the `:root` and dark blocks of `src/index.css`. No component CSS changes.

Light:
- `--ground` `#f3f6f2` → `#f8f9f8`: cleaner, a whisper of green.
- `--surface-sunk` `#e8eee9` → `#e9f2ec`: a mint wash instead of grey-green (chips, pills, skeletons, hovers).
- `--line` `#d8e1db` → `#e3e8e4`: softer hairlines.
- `--ink` `#14211b` → `#0f1713`: closer to black.

Dark: a graphite with a hint of green instead of green-black. `--ground`, `--surface`, `--surface-sunk`, `--line`, `--line-strong`, `--ink`, `--ink-muted`, `--on-bubble-user`, and the glass and capsule values that mirror them.

## Steps
1. Save this plan.
2. Change the tokens and preview with `npm run dev:fixture` (done; the user chose to adopt).
3. Adopt:
   - re-measure the dark glass (and the light one) on real pixels ([results](#results));
   - `theme-color` in `index.html` and `theme_color` / `background_color` in `public/manifest.webmanifest`;
   - docs: `docs/design.md` (frontmatter and Colors, Navigation numbers), ADR 0031, `docs/adr/README.md`.

## Results
- **Contrast of the pairs design.md lists**, computed for the new tokens in both themes: all pass. Lowest text margin: muted ink on the sunk surface, 5.46:1 (light) and 6.50:1 (dark). Strong line against the ground and surface: 3.61 / 3.82 (light) and 3.63 / 3.32 (dark), all ≥ 3.
- **Glass, on real pixels.** Headless Chrome 153 over CDP against `npm run dev:fixture`, 390×844, reduced motion. The dock's ink (labels, icons, dot, disclaimer) is hidden; the real ink color is compared with the worst pixel behind each label, icon and the disclaimer, and with the pixels around the item's outline for the focus ring (from 4 px inside to 2 px outside it, following the pill shape).
  - Uniform worst-case fills under the glass. Light: ink, deep green, brand green, tangerine, ground. Dark: white, ink, the dark primary, tangerine, the user bubble, ground.
  - Real screens beneath it: Chat, Menú, Lista and Perfil, scrolled 36 px at a time (159 steps per theme).

  | Tint | Labels and icons (≥ 4.5) | Ink ring vs. neighbors (≥ 3) | Disclaimer (≥ 4.5) | Dot on capsule (≥ 3) | Worst real content (labels) |
  | --- | --- | --- | --- | --- | --- |
  | **Light 50% (shipped)** | **5.28** | **4.68** | **5.21** | **3.48** | **6.61** |
  | **Dark 68% (shipped)** | **5.80** | **5.80** | **5.80** | **5.07** | **12.31** |
  | Dark 65% | 5.21 | 5.21 | 5.21 | 5.07 | 12.31 |

  - The worst case is the uniform fill again: ink under light glass, white under dark glass. Labels on the active capsule: 18.22:1 (light), 15.14:1 (dark).
  - Against the [2026-10-17 run](2026-10-17-glass-dock-living-color.md#results), labels, disclaimer and dot improved (light labels 5.11 → 5.28, dark 5.35 → 5.80; dark dot 4.71 → 5.07). The ring figures aren't comparable: that run used other tooling, which isn't in this repo, and measured the ring differently (3.50 and 3.31).
  - The tints stay: light 50%, dark 68%. With the new colors dark 65% also keeps more than 10% margin everywhere, so it is available if the dark glass is ever lowered.
- **Build and lint:** `npm run build` and `npm run lint` pass.
- **Not verified:**
  - The glass was measured at 390 px only, not 360 or 1280.
  - Real devices (iOS Safari's `backdrop-filter`, the real status bar with the new `theme-color`).
  - The measuring script is a scratch file and isn't kept in the repo; the method is above.

## Docs
Done: `docs/design.md` (frontmatter colors, Overview, Colors, Navigation), [ADR 0031](../adr/0031-cleaner-neutral-palette.md), `docs/adr/README.md` (0031 added; 0025 and 0026 marked as amended).
