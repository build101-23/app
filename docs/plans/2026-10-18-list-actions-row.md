# The List's actions in one row, unavailable items grayed, $ 0 on crossed items

## Context
More touch-ups on the List tab, from the user:
- "Pedir ahora" should sit at the right edge, on the same line as "Compartir", "Copiar" and "Restablecer lista". The four buttons should be the same size; "Pedir" is the same with the primary color.
- The "Pedir ahora" under the list moves to the right too.
- Items the selected store doesn't have should be grayed out when you pick that store.
- Items crossed out, or lowered to zero, should show "$ 0" on the right.

## Approach
- **One row.** The compact order button moves out of the store block, into `.list-actions`, as its last child with `margin-left: auto`. Share, Copy and Reset become `.button.small` like the reset button already is, and the order button is `.button.primary.small` with the store's icon at 24 px, so the four match. The row wraps when it has to: on a phone the first three fit, and "Pedir" goes to the right of the next line. From about 600 px wide, all four share a line.
- **Bottom button.** `.order`'s own button (and, where Disco and Géant can't be ordered yet, its "Muy pronto" pill) aligns to the right; its notes stay on the left, under it.
- **Unavailable items.** A line is unavailable when the selected store doesn't sell it, or no store does (the lines that already say "No está en {store}" or "No encontrado online"). Those lines get an `unavailable` class: the name goes muted and the checkbox and the − amount + control fade. The note stays readable.
- **$ 0.** With prices read, a crossed-out line shows `$ 0` in the price column, muted and not struck through (the name and the amount already are). Lines without a price, or when prices aren't read, stay empty.

## Check
In `npm run dev:fixture`, List tab: at 390 px the three secondary buttons share a line and "Pedir" is at the right of the next one; at about 640 px all four share one; they have the same height. At Disco (it lacks one item) that item is gray with its note; crossing out an item, or tapping − down to zero, shows `$ 0`; the bottom button is at the right. `npx tsc -b`, `npm run lint`, `npm run build`.

## Docs
`docs/design.md` (List: the actions row, the unavailable lines, the $ 0 and the bottom button).

## Results
- Built as planned, with one change: the order button in the row says "Pedir" with the store's icon, and its accessible name is the whole "Pedir ahora en {store}" (`aria-label`). "Pedir ahora en Ta-Ta" was 202 px wide, so the row needed about 550 px (about 640 with Disco's "Muy pronto" pill beside it); with "Pedir" it needs about 440.
- Checked in `npm run dev:fixture`:
  - at 390 px the four buttons are 40 px tall; Compartir, Copiar and Restablecer lista share a line and "Pedir" is at the right edge of the next one (the four add up to about 440 px, more than a phone's 358). At the pane's 708 px width all four share one line, "Pedir" at the right edge (and Disco's "Muy pronto" at the edge, after it);
  - Disco, which lacks Prepizza: its name is muted, the note says "No está en Disco", and the control is at 55%;
  - crossing out Banana shows "$ 0" in muted type; tapping − on the olive oil down to zero crosses it out and shows "$ 0";
  - the button under the list is at the right edge (16 px from it at Ta-Ta), its notes at the left.
- `npx tsc -b` and `npm run lint` pass.
- Not checked: Géant's disabled button, a screen reader reading the shortened button, Safari.
