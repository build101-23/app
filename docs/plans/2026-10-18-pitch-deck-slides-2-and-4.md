# Plan: v4 deck, slide 02 chores one by one and slide 04 dotted flow

Date: 2026-10-18
Status: applied (slide 02 now takes 5 clicks; checked in the browser, the presenter thumbnail and a 12-page PDF)

## Context

Follow-up on the v4 deck ([v4 plan](2026-10-18-pitch-deck-v4-visual-polish.md), [cover plan](2026-10-18-pitch-deck-cover.md)). The user asked:
- Slide 02 ("Te quedan unas pocas horas para vos."): improve it, and reveal the four chores one at a time.
- Slide 04 ("El end-to-end de tu comida"): "Tu plan" first, then a dotted line that animates across, then "Tu compra".

## Approach

As with the cover and the week, changes are applied in the deck code; the approved `VIVERI_SLIDES` block stays byte-identical and no text changes.

- **Slide 02.** The chores list stops being one staggered fragment; each chore becomes its own fragment, so the presenter clicks through them (4 clicks, then "¿Te olvidaste algo? Volvés." as the 5th). Each chore gets a mint dot (the mark's dot) and its rule draws in from the left as it appears; the chores move to the display face so a single one carries on its own.
- **Slide 04.** The flow line becomes a row of mint dots ending in the tangerine dot. In the brand animation, after the title: "Tu plan" fades in, the dots draw left to right, the tangerine dot lands, then "Tu compra" appears. Resting state is the finished row, so print and the presenter thumbnail show it; reduced motion fades it in; A replays it with the logo.

## Added during the work: slide 06 copy

The user asked to reframe slide 06 positively and chose "Más tiempo para vos. / Más ahorro." (was "Menos tiempo. / Menos esfuerzo. / Menos plata."), with the speaker note changed to match: "Queremos que comer según tus objetivos te deje más tiempo para vos y más ahorro. Se los muestro con mi caso." Applied in the deck code like the other overrides. At 120 px the first phrase takes two lines ("Más tiempo" / "para vos.", mint); "Más ahorro." arrives on a click, tangerine on "ahorro.". Slide title: "Más tiempo para vos, más ahorro". [guion-pitch.md](../notes/guion-pitch.md) has no copy of this line, so nothing else changed.

## Steps

1. Template: slide 02 override and styles; slide 04 dotted line styles and `playBrand` steps. Rebuild and confirm the data block is identical.
2. Browser: step through slide 02's five clicks and back; watch slide 04's sequence in full and reduced motion; presenter thumbnail; print.
3. Docs: this plan to applied.
