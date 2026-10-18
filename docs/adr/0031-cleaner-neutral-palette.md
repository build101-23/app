# 0031. A cleaner neutral palette

- Status: Accepted
- Date: 2026-10-18

## Context
The neutrals read as sage-grey: a green-tinted ground, and grey-green chips and skeletons. That drifts toward the wellness look [design.md](../design.md#overview) says the app avoids. The brand colors can't move: the green dots, the deep green (the app icon's tile) and the tangerine apex are in the approved logo and icons ([ADR 0025](0025-viveri-identity-and-ui-system.md)).

Options considered:
- **New brand colors.** Rejected: it means redrawing the logo and the app icons.
- **Inverted layers**: a near-white ground with tinted cards and bubbles and no borders. Not chosen for now: it changes component CSS and the "one edge per element" rule in design.md.
- **Tune the neutrals only.** Chosen.

## Decision
Tokens only, in `src/index.css`; no component CSS changes.
- **Light:** ground `#F3F6F2` → `#F8F9F8`, sunk surface `#E8EEE9` → `#E9F2EC` (a mint wash for chips, pills, skeletons and hovers), line `#D8E1DB` → `#E3E8E4`, ink `#14211B` → `#0F1713`.
- **Dark:** the change first included a graphite dark theme instead of the green-black one. [ADR 0033](0033-light-theme-only.md) then removed the dark theme, before this shipped, so only the light values above are in the app.
- Unchanged: every brand color, muted ink and strong line, the bubble and danger colors, and the glass tint.
- The ground stays faintly green: the principle "a tinted ground, not grey or cream" holds, with less chroma.

## Consequences
- Every text pair (≥ 4.5:1) and strong line (≥ 3:1) was recomputed, and the glass was re-measured on real pixels ([plan, results](../plans/2026-10-18-modern-palette.md#results)).
- [design.md](../design.md#colors) has the values in use.
- Any later change to the neutrals needs the same re-measure of the glass.
