# 0022. Glass navigation layer

- Status: Proposed
- Date: 2026-10-17

## Context
[ADR 0021](0021-viveri-identity-and-ui-system.md) made the interface flat. Depth came from tone and 1 px lines, never from shadows, and a deep-green tab bar anchored the identity. A UX research pass on 2026-10-17 recommended direction A, "Dock de vidrio, mundo vivo": content gets color, and the navigation floats over it as glass. Its references were Apple's Liquid Glass tab bar and its accessory, Bring!, MyFitnessPal and Material 3 Expressive. A glass dock breaks the flat rule, so this ADR draws the line.

Options considered:
- **Deep-green glass** over a light ground. Rejected: green navigation over green color fields repeats the content's color, which Apple's tab bar guidance advises against.
- **Neutral glass**, "Más legible": white at 85% (dark mode `#0D1613` at 83–85%), muted inactive labels as before. Rejected: it reads as nearly opaque.
- **Neutral glass**, "Más vidrio": white at 50–55% (dark `#0D1613` at 65–70%). Chosen.
- Glass on the top bar too, and a dock that compacts on scroll. Both were offered and declined.
- **A desktop rail** from 960 px, deep green or neutral. The neutral rail was chosen first, then dropped for one floating dock at every width. That matches the parallel v2 preview, whose dock the user liked.

## Decision
- **Where glass goes.** Glass, a light edge and a soft shadow belong to the **navigation layer** only: the dock and, in the chat, the composer that sits above it as the dock's accessory. Everything else stays flat as in ADR 0021: cards, bubbles, fields and the top bar.
- **The material.** The glass is neutral and uses the "Más vidrio" setting:
  - a white tint in light mode and a `#0D1613` tint in dark mode, starting at 55% and 70%, and lowered toward 50% and 65% only where real-pixel measurements still pass;
  - every label in ink, with the active one at weight 650;
  - an opaque active capsule (`#FFFFFF` light, `#16221D` dark) that holds the tangerine dot;
  - a 2 px ink focus ring inside the navigation layer.
  The values in use are in [design.md](../design.md#navigation).
- **Glass is a progressive enhancement.** The dock and its accessory turn opaque (`surface` in light mode, `ground-dark` in dark mode) in these cases:
  - without `backdrop-filter` support;
  - with `prefers-contrast: more`;
  - with `prefers-reduced-transparency: reduce`, where supported.
  
  With `forced-colors: active`, they use system colors and a 1 px border, with no blur or shadow.
- **Living color.** Each screen's top bar becomes a flat, vivid color field, opaque and without glass. **No gradients**, here or anywhere else. The mark keeps its colors and never sits on a field: the splash, the empty profile and the typing bubble stay on `ground` or `surface`, and the app icon isn't placed in the shell.
- **Tangerine is still "the one".** It appears only on the active-tab dot, the send button and the mark's apex: never on a field, a capsule or a call to action.
- **Navigation shape.**
  - The dock is a fixed capsule with four labeled tabs, the same at every width; there is no desktop rail. It doesn't compact on scroll, and on touch screens it hides only while the on-screen keyboard is up and you're typing.
  - The composer is the dock's accessory on Chat only, at every width. Other screens put their main action in their content, never in a second floating layer over the dock.

## Consequences
- The identity moves from the tab bar to the color fields and the mark, and the navigation is the same on phone and desktop.
- On desktop, the brand shows only in the field and the favicon. The rail's app icon is gone.
- Content scrolls under the dock, so every scrolling view must reserve the dock's height (plus the accessory's, in chat) as padding and `scroll-padding-bottom`. Otherwise content or the focused element can end up hidden.
- Label contrast now depends on what passes beneath. Any change to the tint, the dock's colors or the content colors must be re-measured on real pixels against the worst content, as the [v3 plan](../plans/2026-10-17-glass-dock-living-color.md#results) does.
- `backdrop-filter` costs GPU time. Scrolling on a real low-end Android phone is still unmeasured; if it stutters, the opaque fallback is the way out.
- The web only approximates Apple's material (blur and tint, no refraction).
