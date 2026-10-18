# VIVERI v2: "Coral manda" and a floating glass dock

Status: **built and verified** (isolated preview, not merged).

## Context
The user reviewed v1 ([plan](2026-10-17-viveri-visual-redesign.md)) and rejected its muted green and tangerine. Over several rounds in the conversation they rejected eleven palettes: celeste/sun, plum/acid, fuchsia/cyan ("boring", and not their tones), then cherry, egg yolk, bubblegum and night/ice, plus fruit week and pearl. They picked **coral and aquamarine**, the variant where **coral leads**, with **black instead of navy**. They also asked for one translucent, "liquid glass" bottom dock at every width, replacing v1's phone tab bar and desktop side rail.

v2 is a copy of v1's project files in its own folder. Its git baseline commit is v1 unchanged, so `git diff` shows v1 → v2. v1 and `C:\build 101` are not modified.

The user's choice replaces v1's color rules and the rail decision. Everything else in v1 is kept: auth, chat streaming, profile, fixture, states, strings.

Workflow:
- `impeccable` supplies the color method, detector, craft floor and finish review. Its direction roll was replaced by the user choosing among the options shown in the conversation.
- `apple-design` supplies the material rules for the dock.

The web can only approximate Apple's native material with `backdrop-filter`; this doesn't claim to reproduce it.

## Direction provenance
Chosen by the user in this conversation, not by an impeccable concept-seed roll (no seed key). Their answers, verbatim:
- To the three multicolor concepts: "La coral y aguamarina me gusta, pero me gustaria seguir iterando."
- To the four coral-and-aquamarine variants, they picked "A · Coral manda", with: "Asi como esta esta bien. Quizas integraria el negro en lugar del azul marino."

## Identity
| Role | Light | Dark |
|---|---|---|
| Brand field (sign-in, splash) | coral → peach → aquamarine gradient ([stops in design.md](../design.md#secondary)) | same |
| Ground / surface / chips | `#FFF6F2` / `#FFFFFF` / `#FCE6DE` | `#0E0E0E` / `#1A1918` / `#262423` |
| Ink / secondary ink | `#121212` / `#5E524E` | `#F6F1EE` / `#B5ABA7` |
| User bubble | coral, black text | same |
| Primary button | black, white text | coral, black text |
| "The one" (send, active tab) | aquamarine, black text | same |
| Error | `#B3132B` on `#FFE9EB`, with an icon | `#FF8E96` on `#2C1214` |

- **Mark:** coral dots and an aquamarine apex, always on its black tile. Coral (2.8:1) and aquamarine (1.5:1) disappear on white, so the mark never sits on a light ground.
- **Wordmark:** black on light and gradient grounds, white on black.
- **Geometry:** unchanged. The paths are copied verbatim from the approved files, and a script checks them.

**Dev-only picker** with three directions, all with black:
- **Coral manda** (default);
- **Aguamarina manda:** aquamarine bubbles and dots, coral for what's active;
- **Trópico:** coral, sun yellow `#FFD23F` and aquamarine, one color per pair of dots, with a white apex.

The picker and the alternative palettes never reach the production build.

## Steps
1. Save this plan; load impeccable's context; read the craft floor before UI edits.
2. **Tokens** in `src/index.css`, light and dark: field gradient, tile, logo colors, accent, dock material. v1's green/tangerine values are removed.
3. **`src/ui.tsx`:** `Mark` reads token colors; new `Tile` and `Logo` (the approved wordmark paths). Recolor `public/favicon.svg` and `src/assets/viveri-logo.svg`, and re-render the PNG icons with provenance. Update the manifest and theme colors.
4. **Dock:**
   - **Placement:** one fixed, centered, floating pill at every width (`min(100% − 24px, 440px)` × 64 px).
   - **Glass:** `backdrop-filter` blur and saturation, a light-catching top edge, a two-layer shadow, all static. It falls back to solid when unsupported, for reduced transparency or for more contrast; forced colors use system colors.
   - **Tabs:** full-ink labels at weight 600. The active tab gets a solid aquamarine pill, bold text and `aria-current`. No animation on switch.
   - **Keyboard:** hidden while it's up and you're typing.
   - **Layout:** the rail is gone; the header shows the tile and the title.
5. **Space for the dock:** pages reserve room at the bottom. In chat, messages scroll behind the glass, and the composer floats above the dock with its height tracked by a `ResizeObserver`.
6. **Screens:**
   - **Sign-in:** gradient field, tile and wordmark, form on a white card.
   - **Waiting:** a black typing bubble with the mark; the splash on the gradient.
   - **Profile:** coral-tinted chips; the empty state with the tile.
   - **Menu and List:** coral week dots.
7. **Dev picker:** `src/dev/picker.tsx` and `src/dev/directions.css`, loaded only when `import.meta.env.DEV`. It reads `?direction=` and localStorage.
8. **Verify:**
   - build, lint, `impeccable detect`, and no dev code in `dist/`;
   - the logo-geometry script and the contrast script;
   - headless Edge captures:
     - the three directions at 390 px;
     - the default at 360 and 1280 px, light and dark, in every state;
     - the dock over long chat;
     - the keyboard, safe areas and focus;
     - reduced motion, reduced transparency, more contrast, and no `backdrop-filter`.
   - one fresh finish review, one fix batch and one verdict pass.
9. **Docs:**
   - `docs/design.md` rewritten for v2;
   - ADR 0026 superseding 0025, plus the ADR index;
   - `architecture.md` and `development.md`;
   - `.impeccable/design.json`.

## Results
- **Checks:**
  - `npm run build` passes;
  - `npm run lint` finds 0 warnings and 0 errors;
  - `impeccable detect` reports no findings against [design.md](../design.md);
  - no picker, alternative palettes or fixture strings end up in `dist/`;
  - the shipping PNG icons carry their provenance.
- **Logo geometry:** `public/favicon.svg`, `src/assets/viveri-logo.svg`, the `Wordmark` path and the seven `Mark` circles are identical to the approved files (checked by script).
- **Contrast:** text ≥ 4.5:1 and UI graphics ≥ 3:1 for all three directions, light and dark. Dock labels stay ≥ 7.3:1 (light) and ≥ 5.6:1 (dark) over the darkest or brightest content that can sit behind the glass. The active pill's ink ring is 17.5:1 (light) and 16.5:1 (dark) against the glass.
- **Final captures** (headless Edge over CDP, synthetic fixture data, `.impeccable/review/round6/`, 114 screens with measured notes in `report.json`):
  - **The three directions** at 390 px, light and dark.
  - **The default** at 360 and 1280 px, light and dark, in every state.
  - **The glass shows content:** with a coral bubble behind, the dock center goes from #FFF5EF at rest to #FFC0B6 (ΔRGB 78; dark ΔRGB 84). Neutral text behind the blur barely registers (ΔRGB 10–20), which is the expected limit of a 24 px blur.
  - **No stray cut-off text** around the dock: ≤ 1.66:1 below it, above it and beside it on desktop.
  - **Layout:** the last message clears the composer by 54 px and the composer clears the dock. The profile's last content clears the dock.
  - **Keyboard (simulated):** up hides the dock; down brings it back and keeps the conversation at its end. A reader who scrolled up isn't pulled down.
  - **No animation on tab switches:** none right after a switch, and coming back to the chat doesn't replay the history.
  - **Safe areas:** the dock sits 46 px off the bottom with simulated insets.
  - **Focus:** 2 px ink rings, light and dark. In forced colors, a 3 px CanvasText outline on any tab, the active one included.
  - **Fallbacks:** reduced motion turns every animation off. Reduced transparency, more contrast and no `backdrop-filter` give a solid dock and solid edges.
  - **Gradient:** no gray stretch (0 gray pixels on the splash), and warm tones lead (53–60%).
- **Review history:**
  - **First finish review:** three material findings: the glass read as solid, a khaki band in the gradient, and the direction's provenance.
  - **Verdict pass:** all three resolved, plus one regression of mine (a hard veil edge).
  - **Four-lens verification workflow:** further items: stray text around the dock, dark-mode edge separation, a gray seam and coral losing area, the active pill under 3:1, and more.
  - **Final verification workflow:** caught that the first version of the dock "hole" was invalid CSS in Chromium (a % and px mix in a gradient size), plus four smaller items.
  - **Final batch:** fixed all of those and confirmed them in the final captures above. The last capture also exposed a keyboard-close race, which was fixed and confirmed.
- **Not verified:** real devices (iOS Safari, Android Chrome), a real on-screen keyboard, real safe areas, other engines (Safari, Firefox), and real Supabase sign-in (the preview has no `.env`).
