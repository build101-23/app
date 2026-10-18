# "Muy pronto" on the left of its order button

## Context
The user: on the List's split tab (Géant y Ta-Ta), the buttons at the bottom of the list look odd. At 390 px, Géant's disabled "Pedir ahora en Géant" and its "Muy pronto" pill fill the line, so the button starts at the left, while "Pedir ahora en Ta-Ta" under it sits at the right edge: the two buttons zig-zag. In the actions row the same pill lands between Géant's "Pedir" and Ta-Ta's, so it reads as belonging to either.

## Approach
`.order-soon` lays out right to left (`flex-direction: row-reverse`): the pill goes on the left of its button, the button keeps the right edge like every other order button, and when the line wraps the button stays at the right. The DOM order (button, then pill) stays, so a screen reader still reads "Pedir ahora en Géant", then "Muy pronto".

## Check
In `npm run dev:fixture` at 375 px and wide, in light, on the split and on Géant alone: the bottom buttons share their right edge, and in the actions row the pill sits left of Géant's "Pedir".

## Docs
`docs/design.md`: the List's actions row and the button under the list say where the pill goes.

## Results
- Built as planned: one line in `src/index.css`.
- Checked in `npm run dev:fixture`, in light:
  - split at 375 px: "Pedir ahora en Géant" (121–359) and "Pedir ahora en Ta-Ta" (125–359) share the right edge, "Muy pronto" on Géant's left; in the actions row it reads "Muy pronto", Géant's "Pedir", Ta-Ta's "Pedir";
  - at 320 px the bottom pill wraps under Géant's button, at the right; at 1024 px both bottom buttons end at the same edge;
  - Géant alone: both its buttons at the right edge, the pill on their left.
- Not checked: Safari, a screen reader.
- Left as it was: at 320 px Ta-Ta's "Pedir" in the actions row wraps to the start of its own line.
