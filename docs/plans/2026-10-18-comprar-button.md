# The order buttons say "Comprar"

## Context
The user: every order button on the List says "Comprar" instead of "Pedir": "Comprar ahora en {store}" under the list, "Comprar" in the actions row (its accessible name, the whole "Comprar ahora en {store}").

## Approach
`t.cart.order` and `t.cart.orderShort` in `src/strings.ts`. The chat's prompt doesn't name the button, so it stays. ADRs keep the label they were written with.

## Check
In `npm run dev:fixture` at 375 px and wide, in light, on the split and on one store: the labels, and whether the actions row still fits as `docs/design.md` says.

## Docs
`docs/design.md` (List), `docs/product.md` (chat and List), `docs/development.md` (the `cart` fixture).

## Results
- "Comprar" is wider than "Pedir", so on the split at 375 px the actions row's Ta-Ta button wrapped to the start of a line of its own. The order buttons now sit in one `.list-orders` group at the right edge that wraps to the right (`src/List.tsx`, `src/index.css`), replacing the two margin rules.
- Checked in `npm run dev:fixture`, in light:
  - split at 375 px: "Muy pronto" and Géant's "Comprar" on one line, Ta-Ta's under it, both ending at 359; under the list both buttons end at 359, Géant's pill wrapping under its button;
  - Ta-Ta and Géant alone at 375 px: the button at the right edge of the second line;
  - 500 px: Ta-Ta alone still takes a second line (all four need about 520 px); 1024 px: the split's whole row on one line, the order buttons at the right.
- `npx tsc -b` and `npm run lint` pass.
- Not checked: Safari, a screen reader.
