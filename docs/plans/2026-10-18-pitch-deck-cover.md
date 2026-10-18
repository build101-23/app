# Plan: a cover slide for the v4 pitch deck

Date: 2026-10-18
Status: applied

## Context

The user wants the deck (`C:\prompt-lab\output\VIVERI_presentacion_v4.html`, see [the v4 plan](2026-10-18-pitch-deck-v4-visual-polish.md)) to open on a striking cover: the VIVERI logo centred, the team's names and build 101, then the existing 11 slides. Answers from the user:
- Names: Camilo Aguiar · Francisco Carbajal · Iván Guchin.
- No build 101 logo file exists, so the event is set as the text "build 101" in the brand type, not an imitation of its logo.

## Approach

- The approved `VIVERI_SLIDES` block stays byte-identical. The cover is prepended in the deck code (`[cover, ...VIVERI_SLIDES]`), and its logo SVG is taken from slide 4's markup at runtime, so the logo is the same drawing.
- The content slides keep their numbers 01–11 (the script and notes refer to them that way). The cover has no chrome (no chapter, number or bottom rule), shows "00" in the HUD and "Portada" in the presenter view, and is `#0` in the URL; slide N stays `#N`.
- Look: deep green, the logo large and centred, playing the brand animation on entry and on A; under it a short mint rule and the names with mint separators; "build 101" at the foot. Tangerine stays only on the logo's apex.
- The BroadcastChannel and storage keys get a v4 name so the v4 deck and the old deck don't drive each other when both are open (their slide indices no longer match).

## Added during the work: the week on slide 01

The user asked for the "9 → 18" slide to show that the week leaves no time: one bar per weekday that fills almost to the end. Appended in code to slide 01 (decorative, `aria-hidden`), on the empty right side:
- L M M J V bars fill one after another on entry (1.3 s each, 140 ms apart) to 87–91%; the hollow end of each pill is the time left for you.
- S and D join with the existing fragment "Y a veces, también el fin de semana." and fill to 60% and 45%.
- Mint fill and pale outline (no tangerine; "18" stays the slide's one). Print and the presenter thumbnail show the full week; reduced motion skips the growth.

## Added during the work: "9 → 18" reads as hours

"9 → 18" could be read as plain numbers. With the user's approval (a text change on an approved slide), slide 01 shows "9:00 → 18:00": a small grey ":00" on the baseline after each number (the user preferred it low rather than at the cap line), applied in code like the week, so the `VIVERI_SLIDES` block stays as approved. The title went from 300 px to 240 px and the week bars from 300 px to 236 px wide so both fit side by side with about 74 px between them.

## Steps

1. Add the cover data, styles and numbering changes to the v4 template; rebuild; confirm the `VIVERI_SLIDES` block is still identical.
2. Verify in the browser: cover layout and animation, A replay, navigation into slide 1 and back, hashes, presenter view labels and sync, print (12 pages).
3. Docs: this plan to applied; [pitch.md](../notes/pitch.md) mentions the cover.
