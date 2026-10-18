# Plan: redesign of the VIVERI pitch deck (v2, superseded)

Date: 2026-10-18
Status: superseded by 2026-10-18-pitch-deck-v3.md

> **Superseded.** The v2 deck built here (`docs/notes/presentacion/pitch-deck-v2.html`) was based on the older 11-slide brief in `docs/notes/prompt-presentacion.md`, but the deck actually in use is the animated one at `C:\prompt-lab\output\VIVERI_presentacion_animada.html` with a different, newer script. The v2 file was deleted and the doc links reverted. See `2026-10-18-pitch-deck-v3.md` for the plan that applies.

## Context (original)

The v1 pitch deck was built as a Claude artifact (11 slides, 16:9, HTML/CSS) from the brief in `docs/notes/prompt-presentacion.md`. The brief defines the brand system (palette, typography, scale), but a first visual review of the v1 structure shows weaknesses for an investor/jury audience:

1. **Hierarchy**: the kicker, title and body compete; titles are not dominant enough; the giant numbers carry the slide but lack a clear focal scale relationship.
2. **Typographic consistency**: font sizes vary ad hoc per slide instead of following the 300/180/120/88/72/48/32/26 scale from the brief.
3. **Spacing**: brief asks for 128 px margins and lots of air; dense slides (7, 8, 9, 10) risk crowding.
4. **Alignment**: mixed left/center alignment without a rule per slide type.
5. **Graphics quality**: the V-dot motif (seven green dots converging into one orange) is the brand's own graphic device and should carry slides 4->5->6 (morph) instead of generic decorations.
6. **Text density**: several slides show full sentences; for a spoken pitch, on-screen text should be shorter than the spoken script.
7. **Footnotes**: estimates need a consistent, small, honest footnote style on every slide that carries a number.
8. **Deck mechanics**: keyboard navigation, slide numbers, hidden backup slide, print-to-PDF fidelity (fixed 1280x720 stage scaled to viewport).

## Assumptions

- **Format**: self-contained HTML file, one `<section class="slide">` per slide, fixed 1280x720 stage (16:9), CSS custom properties per the brand tokens, arrow-key/click navigation, `Ctrl+P` prints one slide per page. Same format as v1 so the user can open/export it the same way.
- **Brand identity**: the one defined in `docs/notes/prompt-presentacion.md` section 2 and ADR 0025: palette `#0b3d2b / #f3f6f2 / #14211b / #55645c / #b6c5be / #1e8a5e / #156b49 / #5cc495 / #e85d2a / #0d1613`, Bricolage Grotesque 700-800 for titles/figures, DM Sans for text, size scale 300/180/120/88/72/48/32/26 (min 24 px for on-screen text; footnotes are the deliberate exception at ~14 px).
- **Real logo**: `src/assets/viveri-logo.svg` (horizontal, 260.56x72) is embedded inline as SVG where the full logo appears (slides 6, 11). The V-dots mark alone (slides 5, 10 apex) is drawn from the logo's own dot geometry (six green circles + one orange, viewBox 8-67.76 / 12.93-55.9), not redesigned (ADR 0025: nobody redraws or recolors the mark).
- **Content unchanged**: text, numbers, structure and slide order stay exactly as in the brief; changes are layout, sizing, spacing, alignment and footnote styling only. Where the brief's on-screen text is long, it is kept verbatim.
- **Language**: all UI text Spanish rioplatense; code/comments in English per AGENTS.md.
- **Output**: `docs/notes/presentacion/pitch-deck-v2.html`, plus a copy in the chat as a widget for preview. The deck is a deliverable file, not app code: no `.md` outside `docs/` per AGENTS.md.

## Improvements to apply

Per slide type:

1. **Design system first**: CSS tokens for both themes, the full size scale as `--fs-*` variables, a `--margin: 128px` stage padding, `.kicker` / `.title` / `.body` / `.foot` primitives so every slide composes the same pieces. Fixes 1, 2, 3.
2. **Alignment rule**: number-driven slides (2, 3, 10) center the figure; narrative slides (1, 5, 6, 11) center the statement; panel slides (8, 9) use a strict left-aligned grid. Fixes 4.
3. **V-dots morph (wow moments)**: slide 4 shows three cards each with a green dot; slides 5 and 6 show the converged orange dot and the full logo statically, with CSS that visually rhymes (same dot sizes/positions). A true cross-slide morph is not possible in a static file; instead each slide draws the exact target state so the speaker's click reads as the morph, and an optional `@media (prefers-reduced-motion: no-preference)` fade/scale transition animates dots *within* slide 5 (green dots converge into the orange one on load). Fixes 5 honestly without fake cross-slide animation.
4. **Text density**: keep the brief's exact wording but split with clear hierarchy: kicker 26 px uppercase tracked, title 88-120 px Bricolage 800, body 32 px DM Sans max ~14 words per line, one accent color use per slide. Footnotes 14 px DM Sans in secondary color, bottom-left, prefixed "Estimación:". Fixes 6, 7.
5. **Mechanics**: fixed 1280x720 stage centered and scaled via `transform: scale()` computed from viewport; arrow keys, click, and swipe navigate; slide counter "N / 11" bottom-right in secondary color; backup slide 7b is reachable (after 7) but marked "respaldo" and skipped by the linear flow unless navigated directly (class `hidden-slide`, excluded from the counter); `@media print` renders each slide at exactly 1280x720 one per page. Fixes 8.
6. **Demo slide (7)**: giant orange "EN VIVO" pill, the phrase in a white bordered card with the three key parts in orange, a real running timer (starts on slide enter, monospace tabular figures) — no app screenshots per the brief.
7. **Slide 8 panels**: two equal-height panels, left gray ("Sin IA") with muted text, right dark green ("Con IA") with the four verb rows (Entiende / Busca / Decide / Actúa) as a definition list with orange verbs.
8. **Slide 10**: three big figures in a row (Plata / Tiempo / Salud), then a full-width bordered strip with the 40× economics; the 40× is the slide's one giant orange number.

## Steps

1. Write `docs/notes/presentacion/pitch-deck-v2.html` implementing all of the above. Content strings copied verbatim from `docs/notes/prompt-presentacion.md`.
2. Validate: open-check the HTML for well-formedness (no build step exists for a standalone file); verify with a quick parse (python or node available in the repo) that all 12 sections exist and there are no unclosed tags.
3. Emit the deck preview as a widget in chat.
4. Docs step: update `docs/notes/pitch.md` and `docs/notes/guion-pitch.md` to point to the v2 file (one fact, one place: link, don't copy). Add a line in `docs/notes/prompt-presentacion.md`? No — that file is the upstream brief, leave it untouched. Instead note the v2 location in `pitch.md`. No ADR needed (visual execution of an existing approved identity, not a new decision). No `docs/adr/README.md` change.

## Out of scope

- Changing any text, number or message of the pitch.
- Building the 60 s backup video or the real screenshots for slide 7b (placeholders marked where the two captures go).
- Cross-slide true morph animation (PowerPoint Morph/Magic Move); documented as a static rhyme instead.
