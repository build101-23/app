# "Restablecer lista" as a small button, and smaller − and + steps

## Context
Two touch-ups on the List tab, from the user:
- The "Lista nueva" link next to "Compartir" and "Copiar" should be a small button called "Restablecer lista".
- The − and + circles are too big (44 px), now that they sit under each item's name.

## Approach
- **Reset button:** the same action (it asks to confirm, then clears every "ya tengo" mark), as a secondary pill like its neighbors but smaller. A new `.button.small` variant: 40 px tall, 16 px padding, 0.875rem text. The label moves to `t.list.reset` = "Restablecer lista" (only used there). It still shows only when there is something to reset.
- **Steps:** the circles go from 44 px to 32 px, with a 1rem sign. A transparent `::after` 6 px larger on every side keeps the tap target at 44 px, so smaller doesn't mean harder to hit; the amount between them keeps the two targets apart. The amount's minimum width goes down with them, and the skeleton's control bar (32 px) follows, so the placeholder and the row stay the same height.

## Check
In `npm run dev:fixture`, List tab at 390 px: the reset button is hidden with nothing marked and shown after crossing something out, and it asks before clearing; the circles measure 32 px and their hit area 44 px; a row and its skeleton have the same height. `npx tsc -b`, `npm run lint`, `npm run build`.

## Docs
`docs/design.md` (Buttons: the small variant; Shapes and List: the 32 px circles with a 44 px target, the reset button), `docs/product.md` (the button's name).

## Results
- Built as planned: `t.list.reset` is "Restablecer lista", shown as `button secondary small` (144 × 40 px at 390 px); at that width it wraps under "Compartir" and "Copiar". The − and + circles are 32 px, and an element 5 px outside a circle resolves to it, so the 44 px target holds. A row is 89 px and its skeleton too.
- Checked in `npm run dev:fixture` at 390 px, light: the button appears with a mark (Banana is crossed out in the fixture), asks "¿Desmarcar todo lo que tenés en casa?", leaves the mark when cancelled, and clears it and disappears when confirmed. `npx tsc -b` and `npm run lint` pass.
- Not checked: a real finger on the 32 px circles, a wide screen, Safari.
