# Plan: VIVERI pitch deck v3, on the new script and the real deck's mechanics

Date: 2026-10-18
Status: applied
Supersedes: 2026-10-18-pitch-deck-redesign.md

## Context

The deck actually in use is `C:\prompt-lab\output\VIVERI_presentacion_animada.html`: 11 slides, 16:9 (1280x720), fragment reveals, brand animation, presenter view, timers, served on localhost:8080. Its script is the NEW one the user pasted (hook "9→18", "otro trabajo", "end-to-end de tu comida", "una frase", "menos tiempo/esfuerzo/plata", live demo, vision, opportunity, pilot 10–15, closing). The earlier brief in `docs/notes/prompt-presentacion.md` is the OLD script — v2 was wrongly built on it and was deleted.

Goal: rebuild the deck with (a) the new script's exact on-screen content and speaker notes, (b) the real deck's mechanics and layout language, and (c) the visual fixes identified on review. Deliver as a NEW file, never overwrite the working deck.

## Weaknesses found in the current animated deck

1. Typography off-brand: Bahnschrift/Arial instead of Bricolage Grotesque (display) + DM Sans (body), per the brand brief.
2. Slide 5 ("Una frase"): the three inputs (the core idea) render at 29px gray — reads like a footnote; the three outputs start at 24px.
3. Slide 10 (pilot): the giant "10–15" fights three equal-weight questions; the monetization strip (the "how we make money" answer) reads as a detail.
4. Minor inconsistencies: arrows differ across slides ("→" chip vs flow-line vs bare character); slide 2 underline lengths vary; some slides leave the right side empty.

## Changes to apply

1. Fonts: load Bricolage Grotesque 700/800 and DM Sans 400/500/700 from Google Fonts with local fallbacks (Bahnschrift/Arial) so the deck still renders offline on the pitch laptop. Set --display and --body to the brand fonts.
2. Slide 5: raise the three inputs to ~32px in the theme's strong text color with separators; outputs body text 26-28px; keep the three-column output grid.
3. Slide 10: reduce "10–15" from 158px to ~120px; give the three questions a shared left alignment and equal size; raise the monetization strip's presence (bigger label, green value at 32px, top border kept).
4. Uniform arrows: keep the flow-line motif (slide 4) and reuse the same middot/arrow treatment elsewhere; align slide 2 underlines by giving all four chores the same border treatment (already shared — keep).
5. Keep everything else: structure, fragment mechanics, brand animation, presenter view, timers, print CSS, reduced-motion handling, the exact on-screen texts and notes from the current deck's VIVERI_SLIDES data.

## Steps

1. Copy `C:\prompt-lab\output\VIVERI_presentacion_animada.html` to `C:\prompt-lab\output\VIVERI_presentacion_v3.html` as the starting point (new file; the working deck stays untouched).
2. Apply the font loading + variable changes, slide 5 and slide 10 adjustments, arrow uniformity. No text content changes.
3. Validate the HTML (balanced tags, 11 slides in VIVERI_SLIDES, script parses) with node.
4. Docs step: update this plan's status; no ADR (visual execution of an approved identity, not a new decision). pitch.md and guion-pitch.md already point to the real deck file; add the v3 path next to it once the user picks it.

## Out of scope

- Changing the working deck in place (v3 is a sibling file; the user switches when ready).
- Text/message changes, slide order, notes changes.
- The backup video/screenshots for the demo.
