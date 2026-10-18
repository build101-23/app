# VIVERI v3: neutral glass dock and living color

Status: **built, in review** (isolated preview, not merged). Results are at the end.

## Context
The UX research pass of 2026-10-17 (`C:\prompt-lab\results\referencias-ux-viveri\v1\research.md`, sections 6, 6.1 and 7) recommended direction A, "Dock de vidrio, mundo vivo": content gains color, and the navigation floats over it in glass. The user then chose a **neutral** glass dock (translucent white in light mode, near-black in dark mode) with tangerine as the only accent, using the **"Más vidrio"** setting. This plan builds priorities P0 to P2 of that brief on top of the v1 redesign ([plan](2026-10-17-viveri-visual-redesign.md), [ADR 0023](../adr/0023-viveri-identity-and-ui-system.md)).

Where: `C:\prompt-lab\previews\viveri-web-redesign\v3`, a copy of v1's files (tracked and untracked, without ignored files, `.env` or v1's review captures). Its first git commit is v1 unchanged, so `git diff` shows v1 → v3. `v2` was not used: it already holds another session's uncommitted "coral" exploration. `C:\build 101`, v1 and v2 are not modified.

### Decisions
Taken by the user on 2026-10-17 before this plan:
- **Glass material:** "Más vidrio".
  - Light mode: a white tint at 55%. Go down toward 50% only if the measured contrast allows it.
  - Dark mode: `#0D1613` at 70%. Go down toward 65% under the same condition.
  - All tab labels are in ink, and the active one is at weight 650.
  - The active capsule is opaque (`#FFFFFF` light, `#16221D` dark) and holds the tangerine dot.
  - Inside the dock, the focus ring is 2 px of ink.

The user's answers to the brief's open questions, in this session:
| Question | Answer |
| --- | --- |
| Does the top bar get glass too? | No. It stays opaque and becomes the screen's flat color field. |
| Does the desktop rail stay deep green? | No. It becomes a neutral, opaque surface, with the same active capsule and dot. Superseded by [revision 1](#revision-1-the-dock-at-every-width): there's no rail, and the pill sits at every width. |
| Does the dock compact on scroll? | No. It stays fixed, with all four labels always visible. |
| Tab label size? | 13 px. |

My defaults for the brief's minor open points, to revisit in review:
- **Disclaimer:** always visible under the composer, not only on the empty chat. It's a health product, and the consent link stays reachable.
- **Consent link:** health-data consent doesn't exist yet (milestone 6). The link opens a small dialog that says so, with a "Muy pronto" pill, and states only what is true today: messages and what you tell the chat stay saved in your account. No legal text is invented.
- **Intent cards:** tapping one sends it as your message.
- **Status line:** "Armando la respuesta…" until the first words arrive, then "Escribiendo…" until the stream ends.
- **Color fields:** one vivid green in light mode (`#2FCB7E`, ink title 7.9:1) and a deep, saturated green in dark mode (`#14684A`, light title 5.7:1). No gradients. The mark never sits on a field.
- **Desktop composer:** stays in flow at the bottom of the chat column. There is no dock at 960 px and wider, so there's nothing to attach it to. Superseded by revision 1: the composer is the dock's accessory at every width.

## Steps
1. Save this plan.
2. **P0 docs.**
   - Write ADR 0024, "Glass navigation layer". It limits the "Flat" rule to content and allows blur, a light edge and a soft shadow only on the navigation layer (the dock and the chat's accessory). It also records:
     - the neutral glass and the "Más vidrio" values;
     - the opaque fallbacks;
     - the open questions answered above;
     - that no gradient is allowed.
   - Add 0024 to the ADR index.
   - Update `docs/design.md` (§6.1):
     - the Overview and its Key Characteristics;
     - the `tab-bar` frontmatter, now as glass tokens, plus new `field` and `rail` tokens;
     - Colors, for the field;
     - Navigation, for labels, the capsule, the dot, focus and the rail;
     - Elevation & Depth, with its one exception;
     - the opaque fallback and forced colors;
     - Layout, for clearance, the dock position and the keyboard;
     - Components, for the intent cards, the disclaimer, the status line and the accessory;
     - Do's and Don'ts.
3. **P1 tokens** (`src/index.css`), in light and dark:
   - `--field` and `--on-field`;
   - the glass tint, the solid fallback, the capsule color, the edge and the shadow;
   - the dock's size and clearance values;
   - focus inside the dock set to ink.
4. **P1 dock** (`src/App.tsx`, `src/index.css`):
   - **Placement:** a floating capsule, 64 px tall, `max(12px, safe-bottom)` from the bottom, 12 px from the sides plus the side safe insets, at most 440 px wide and centered.
   - **Tabs:** four items with a 24 px icon and a 13 px label, all in ink. The active item is an opaque inner capsule with the tangerine dot above the icon, its label at weight 650, and `aria-current="page"`.
   - **Material:** `backdrop-filter` with the `-webkit-` prefix, blur only (no `saturate()`, so the measurements match the model).
   - **Fallbacks:**
     - `@supports not (backdrop-filter)` uses the solid color;
     - `prefers-contrast: more` uses solid plus a strong border;
     - `prefers-reduced-transparency: reduce` uses solid (support to be checked);
     - `forced-colors: active` uses system colors, a 1 px border, and no blur or shadow.
   - **Keyboard:** while the keyboard is up and the composer has focus, the dock hides (as today) and the composer drops to the bottom.
   - **Clearance:** pages pad and `scroll-padding-bottom` by the dock's clearance, so nothing hides under the dock and focus is never covered.
   - **Desktop:** at 960 px and wider, the neutral opaque rail with ink labels and the same capsule and dot. The capsule gets a strong-line outline there, because white on white wouldn't show.
5. **P1 color fields:** the title bar becomes a flat field with `--on-field` text and no bottom line. The "Muy pronto" pill stays opaque on it. Splash, sign-in, the empty profile's mark and the typing bubble stay on `ground` or `surface`.
6. **P2 chat** (`src/Chat.tsx`, `src/strings.ts`):
   - **Empty state:** the welcome bubble, then four intent cards in the user's voice, sitting low near the composer.
   - **Status line:** a visible `role="status"` line while a reply is pending or streaming. It replaces the screen-reader-only "Escribiendo…".
   - **Composer as the dock accessory** (phone only): a glass capsule above the dock holding the field, send and the disclaimer. A `ResizeObserver` tracks its height for the message list's clearance and keeps the list pinned to the bottom when the composer grows.
   - **Disclaimer:** "No reemplaza a tu nutricionista." plus a "Tus datos de salud" link that opens a `<dialog>` explaining that consent is coming.
7. **Fixture:** a `reply=trickle` scenario that streams slowly enough to capture the status line, documented in `development.md`.
8. **Verify:**
   - `npm run build` and `npm run lint` pass, and no fixture code is in `dist/`.
   - Screenshots come from headless Edge over CDP at 360, 390 and 1280 px, light and dark, with reduced motion.
   - Measure real pixels of the dock with its text hidden: labels against worst-case backdrops injected under the dock (deep green, ink, brand green, tangerine, the field; in dark: white, ink, the dark primary, tangerine) and against real scrolled content. Compute ink, the focus ring and the dot against the measured worst pixel.
   - Lower the tint toward 50% or 65% only if the measurements allow.
   - Check by geometry that nothing is hidden under the dock and that focus is never covered.
9. **Docs:** finish `design.md`, ADR 0024, the ADR index, `development.md` (fixture), and append results here.

## Revision 1: the dock at every width
The user's decision after the first review, in their words: "Use the floating pill dock at every width in both previews (as in v2), and drop the desktop rail." It replaces the rail answer in the table above. Each step was saved here before coding:
1. **Dock:** the same floating pill at every width, centered in the viewport.
   - The 960 px rail, its layout grid and its hover rules are removed, along with the `--rail` token.
   - The rail's app icon (`.nav-brand`) goes too. It would sit on the green title field, and the mark never sits on a field.
2. **Chat:** the composer is the dock's accessory at every width.
   - On wide screens it may be as wide as the 720 px content column, while the dock stays at most 440 px.
   - The in-flow desktop composer goes.
3. **Clearance:** the page and message-list clearance and `scroll-padding-bottom` apply at every width.
4. **Keyboard:** the dock now exists on wide touch screens too (a landscape tablet). Hiding it while the keyboard is up follows `pointer: coarse` instead of `max-width: 959px`, so resizing a desktop window never hides it.
5. **Docs:**
   - `design.md`: Layout, Navigation, Typography, Shapes, Chat, Elevation & Depth, and Do's and Don'ts.
   - The frontmatter: drop `rail`.
   - ADR 0024 (still Proposed): the decision and the options.
6. **Re-verify:**
   - build, lint, and no fixture code in `dist/`;
   - geometry at 360, 390 and 1280 px;
   - contrast at the shipped tints, now also at 1280 px;
   - the screenshots.

## Results
- **Built:** every step above, in `v3`. `git diff` against the baseline commit shows the whole change. `C:\build 101`, v1 and v2 were not modified.
- **Build:** `npm run build` passes. `npm run lint` (oxlint) reports 0 warnings and 0 errors on 15 files, including the review scripts.
- **No fixture code in `dist/`:** a search for the fixture's markers (`persona@ejemplo`, `fixture-token`, `fixture error`, `trickle`, its sample conversation) finds nothing. The new strings are present.
- **Review tooling and evidence:** in `.impeccable/review/v3-glass/`. This is local review evidence, not part of the app.
  - `lib.mjs`, `measure.mjs`, `geometry.mjs` and `shots.mjs` drive headless Chrome 155 over the DevTools protocol, against `npm run dev:fixture` (here on port 5377).
  - Their outputs are `measure-results.json`, `measure-results-current.json` and `geometry-results.txt`, plus `shots/`.
- **Screenshots:** 76 in `shots/`, at 360×640, 390×844 and 1280×800, light and dark, all with `prefers-reduced-motion: reduce` emulated.
  - States: the chat (at the end, and scrolled with bubbles under the glass), the empty chat with intent cards, waiting ("Armando la respuesta…"), streaming ("Escribiendo…"), the health-data dialog, Menú, Lista, the profile (scrolled to the end), the empty profile, and keyboard focus on the dock or rail.
  - Also at 390 px: focus in the composer, a simulated on-screen keyboard, `prefers-contrast: more`, `prefers-reduced-transparency: reduce` and `forced-colors: active`.
- **Glass contrast, measured on real pixels.**
  - **Method:** for each theme, at 360 and 390 px and for each candidate tint, `measure.mjs` hides the navigation layer's own ink (labels, icons, dot, disclaimer). It then screenshots the glass and computes the real foreground color against every pixel behind each label, icon, ring band, the dot and the disclaimer.
  - **Backdrops:** uniform worst-case fills injected under the layer, and the real chat and profile scrolled beneath it in 24 px steps.
    - Light fills: ink, deep green, brand green, tangerine, the field and the ground.
    - Dark fills: white, ink, the primary, tangerine, the field and the user bubble.

  | Tint | Labels and icons (≥ 4.5) | Ink ring vs. neighbors (≥ 3) | Disclaimer (≥ 4.5) | Dot on capsule (≥ 3) | Worst real content (labels) |
  | --- | --- | --- | --- | --- | --- |
  | Light 55% | 5.87 | 3.93 | 5.80 | 3.48 | 6.66 |
  | Light 53% | 5.57 | 3.73 | 5.50 | 3.48 | 6.35 |
  | **Light 50% (shipped)** | **5.11** | **3.51** | **5.04** | **3.48** | **5.94** |
  | Dark 70% | 5.87 | 3.44 | 5.87 | 4.71 | 11.53 |
  | **Dark 68% (shipped)** | **5.35** | **3.31** | **5.35** | **4.71** | **11.08** |
  | Dark 65% | 4.89 | 3.13 | 4.89 | 4.71 | 10.81 |

  - The worst case is always the uniform fill: ink under light glass, white under dark glass. Over a uniform region, blur changes nothing, so these match the alpha-blend calculation in `glass-contrast.mjs` (light 55% → 5.87, 50% → 5.11; dark 68% → 5.37, 65% → 4.81). The calculation's starting points hold, now on real pixels. Real content is easier, because blur averages text strokes into lighter or darker mixes.
  - **Rule used:** the lowest measured tint that keeps at least 10% margin over every threshold. That gives white at 50% and `#0D1613` at 68%. Dark 65% passes, but leaves the ring at 3.13:1 against a white fill.
  - **Confirmation:** a run at the shipped values, with no override, gives the same numbers (`measure-results-current.json`).
  - **The composer field's ring** against its neighbors measures at least 4.36:1 (light) and 3.98:1 (dark).
- **Geometry: 42 of 42 checks pass** (`geometry-results.txt`):
  - At 360×640, 390×844 and 1280×800, each view scrolled to the end has its last content above the dock and composer: chat (long and empty), Menú, Lista, the profile (full and empty).
  - Tabbing through every view, no focused control is under the glass or outside the visible area.
  - With a simulated keyboard (viewport 844 → 500 px with the composer focused), the dock hides, the composer sits 8 px above the keyboard, and the last message stays clear. When the keyboard goes down, the dock returns while the textarea keeps focus.
  - The disclaimer's link opens the dialog with focus inside, and Escape closes it.
- **Found and fixed along the way:**
  - Chromium makes the message list keyboard-focusable (it's a scroller with no focusable children), and its 2 px outer ring ran under the glass. It now draws inside its own edge (`outline-offset: -2px`). The top and sides stay in view, and only the bottom edge passes behind the glass.
  - The v2 session didn't reproduce the focusable list there. The fix is harmless either way.
- **`prefers-reduced-transparency`:** supported only in Chromium 118+ (Chrome, Edge, Chrome Android, Samsung Internet). Firefox has it behind a preference, and Safari doesn't support it (MDN compat data). In Chromium, the rule works and is emulated in the screenshots. Elsewhere glass stays on, which is why the contrast was measured assuming glass.
- **Tooling note:** the first runs used headless Edge, as v1 did. On this machine, a fresh Edge profile signed in with the Windows account and synced extensions. Their welcome tabs pushed the measured page into the background, and `requestAnimationFrame` stalled. Those runs were discarded, their processes stopped, and the throwaway profiles deleted. The tooling now uses Chrome with extensions, sync and background throttling turned off.
- **Not verified:**
  - Real devices: iOS Safari's `backdrop-filter` rendering, a real on-screen keyboard, iOS standalone mode, and real safe areas.
  - Scrolling performance on a low-end Android phone; if it stutters, use the opaque fallback.
  - Real Supabase: the copy has no `.env`.
- **Revision 1 results** (the dock at every width):
  - The rail, its grid, hover rules, token and app icon are gone. The pill dock and the composer accessory are the same at every width; at 1280 px the accessory spans the 720 px column above the 440 px dock.
  - Re-verified after the change:
    - build, lint (0 warnings, 0 errors) and no fixture code in `dist/`;
    - geometry 42 of 42 at 360, 390 and 1280 px, now with the dock and accessory overlaid on desktop too;
    - contrast at the shipped tints, now also at 1280 px, with unchanged worst cases (light ring 3.50:1 at 1280 px);
    - all 76 screenshots recaptured.
  - The keyboard rule now follows `pointer: coarse`. The simulated keyboard check at 390 px still passes.
- **Still open:**
  - **Coordination with v2.** The user settled the dock shape: the floating pill at every width in both previews. v2 already works that way. The palette is still open in both previews: v2's coral was rejected, and v3 keeps green and tangerine. Both sessions agreed to share structure and clearance rules. An independent read-only check of v2's glass, using this tooling, runs as its own session.
  - **Health-data consent:** the dialog's copy is a placeholder until milestone 6, and the final consent text needs legal review (Law 18.331).
  - **Browser theme color:** `theme-color` still matches the ground, not the title bar's field.
  - **Disclaimer visibility:** it shows on every chat state; the brief left that open.
