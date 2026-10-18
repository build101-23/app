# Plan: VIVERI pitch deck v4, keynote-level visual polish

Date: 2026-10-18
Status: applied

## Context

The deck in use is `C:\prompt-lab\output\VIVERI_presentacion_animada.html`: 11 slides at 1280x720, fragment reveals, the brand animation (dotted V + tangerine ring), presenter view, pitch and demo timers, print to PDF, and a reduced-motion variant. The user asked for its visual design to be raised to a professional keynote level, delivered as a NEW file `C:\prompt-lab\output\VIVERI_presentacion_v4.html`. The working deck is not touched.

Hard limits:
- Content is frozen: the 11 slides, every on-screen text, the speaker notes and the order. If a design idea needs a text change, stop and ask.
- Brand: [ADR 0025](../adr/0025-viveri-identity-and-ui-system.md), [design.md](../design.md#colors) and the deck brief in [prompt-presentacion.md](../notes/prompt-presentacion.md) (section 2: palette, Bricolage Grotesque + DM Sans, size scale 300/180/120/88/72/48/32/26, 24 px minimum, 128 px margins, white cards with thin borders and 24 px corners). No new colors or fonts.
- Mechanics stay: logo animation (refine, don't redesign), fragments, presenter view, timers, print, reduced motion.

## Approach

Keep the `VIVERI_SLIDES` data block byte-identical (texts, notes, markup), so the content is provably unchanged. All design work goes into the CSS and small, additive JS changes.

1. **Tokens and fonts.** Brand fonts embedded as base64 woff2 subsets (only the glyphs the deck uses), so the deck renders in Bricolage Grotesque and DM Sans offline; Bahnschrift/Segoe UI/Arial stay as fallbacks. Type-scale and spacing tokens on `:root`. Text on dark uses the brief's `#f3f6f2`; labels on light use the text-safe green `#156b49`.
2. **Grid.** 128 px side margins, one vertical rhythm: chrome at the top, content in a safe area, bottom rule. Every slide re-laid out on that grid so nothing leaves a large empty side.
3. **Hierarchy per slide.** Snap sizes to the brief's scale so the eye lands first on the number or phrase that matters, then the title, then support.
4. **Color discipline.** One tangerine element per slide (the logo apex is the mark, not an accent). Where a slide has two, the secondary one moves to ink or green.
5. **Contrast.** Every text pair ≥ 4.5:1; tangerine only at display sizes (≥ 48 px, WCAG large text, ≥ 3:1); lines and graphics that carry meaning ≥ 3:1 (strong line `#74877d` on light).
6. **Motion.** Fragments: longer, softer ease-out with a small rise and an even stagger. Slides: a short dissolve between slides (dark/light alternation no longer hard-cuts), then the content settles. Logo animation: same choreography, slightly calmer timings. Reduced motion: opacity only.
7. **Slide 7 (demo).** The on-slide demo clock becomes a white card with a large tabular readout and a state dot (running/paused) readable at 3 m.
8. **Verification.** Node script: the `VIVERI_SLIDES` block is identical to the working deck's. Browser: walk the 11 slides with all fragments, replay the logo (A), open the presenter view and check sync and timers, print preview / PDF render, reduced motion.

## Steps

1. Copy the working deck to `VIVERI_presentacion_v4.html`.
2. Build the font subsets and embed them.
3. Rewrite the deck CSS (tokens, grid, per-slide layouts, motion); add the dissolve and the demo-clock state in JS.
4. Verify as in point 8; fix and re-check.
5. Docs: set this plan to applied with results; link v4 next to the deck path in [pitch.md](../notes/pitch.md) if it lists it. No ADR: this executes an approved identity, it doesn't decide a new one.

## Results

- `VIVERI_presentacion_v4.html` (128 KB, fonts included) built from a template plus the working deck's `VIVERI_SLIDES` block copied verbatim; a script confirms the block is identical and that both scripts parse.
- Layout audit in the browser: no element past the 128 px margins or the safe area, no clipped text, on all 11 slides with every fragment shown.
- Contrast audit: every non-tangerine text pair ≥ 4.5:1 (the pilot's "10–15" and the demo arrows were raised to green ink and muted ink to get there). Tangerine text is 3.5:1 on deep green and 3.2:1 on the light ground, used only at 48 px and up, which passes WCAG large text (3:1) but not 4.5:1; changing that means changing a brand color, so it stays.
- Chrome labels (chapter, slide number) are 17 px, below the brief's 24 px minimum, as deliberate chrome like footnotes.
- Logo animation fires on entry and on A, in full motion (`?motion=full`) and in the reduced-motion fade.
- Presenter view syncs both ways and shares the timers; its thumbnail no longer shrinks slide titles (an inherited `.presenter-main h1` selector bug, now `.presenter-main>h1`).
- Headless Chrome print: 11 pages at 1280x720, backgrounds kept (`print-color-adjust: exact`), fragments shown.

## Out of scope

- Any text, notes or order change.
- Redrawing or recoloring the logo.
- The app's own UI.
