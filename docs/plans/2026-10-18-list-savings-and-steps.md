# The List tab: savings card, order button on top, prices that follow − and +, new rows

## Context
Four requests on the List tab (`src/List.tsx`):
1. The saving is one line of text ("Ahorrás $ 15 frente al promedio…"). It should be a small card, and say what the menu would save over a month if repeated.
2. "Pedir ahora" is only at the very bottom. Put it on top too, so nobody has to scroll.
3. Lowering the amount of something doesn't update the prices.
4. In each row, the − and + go under the item's name, and the price goes to the right column.

**Why prices don't move (read in the code):** `stepHave` steps 100 g (`stepOf` in `supabase/functions/_shared/list.ts`), but the price is per whole unit of sale (`cost()` in `stores.ts`: `ceil(amount / base_qty) × price`). Boniato at 1.8 kg goes to 1.7 kg and the store still sells 2 bags of 1 kg, so nothing changes until it crosses 1 kg. `Offer.by_weight` exists and `cost()` supports it, but nothing has set it since [ADR 0023](../adr/0023-scraper-prices-for-the-unit-of-sale.md); only the tests use it.

**Decisions from the user:**
- What is bought by weight (fruit, vegetables, loose meat) should drop in price in proportion to the grams; what comes in a pack drops by one pack.
- The amount sits between the − and the +.
- The monthly figure is the saving × 30 ÷ the menu's days.
- The top order button shows in every store, disabled with "Muy pronto" at Disco and Géant.

## Approach
1. **Price by weight what the store sells by weight.** `offerOf` (`supabase/functions/_shared/products.ts`) sets `by_weight` when `size_source` is `'unit'`, the rows it already flags `weighed`; `cost()` then charges `amount × price / base_qty`. This uses the store's own flag, not the catalog's section, so each store decides per product. `lineOf` adds `byWeight`, so the screen shows a weight, not "N ×", on those lines; `packs` stays for the cart.
2. **Step by pack for the rest.** `stepHave(item, have, dir, step?)` takes an optional step. For a priced item that isn't by weight the List tab passes the selected store's unit of sale (`offer.base_qty`): the amount to buy is normalized to whole packs, one pack more or less, and the top is the menu's amount, where the mark goes. By weight, or without a price, the step stays as it is (100 g, 10 g under 100).
3. **Rows.** Left: the checkbox and the name; under it the product line (muted, a link) and the "menú: X" hint when it differs; under that `−  amount  +`. The amount is a weight for by-weight lines, "2 × 1 kg" (packs of the selected store) for packed lines, and the catalog's text where there's no price. Right: the line's price, in tabular figures. The 44 px targets stay.
4. **Savings card.** Replaces the saving line in the store block: "Ahorrás $ 15" with "frente al promedio de los súper", and "Unos $ 64 al mes" with a note that it is this menu repeated for a month at today's prices. Same condition as before (the recommended store's tab, saving above zero).
5. **Order on top.** `Order` gets a `compact` prop: the button only (a link at Ta-Ta, disabled with "Muy pronto" elsewhere), no notes or status. It sits under the per-day and budget lines and the savings card, with the same condition as the full one below, which keeps its notes.
6. **Fixture.** The loose produce (banana, boniato, tomato, onion, lemon) is marked `weighed`, as the stores sell it, so proportional prices can be seen; the rest stays by pack.

## Tests
`offerOf` sets `by_weight` and `weighed` only for `size_source = 'unit'`; a by-weight line's cost follows the grams and a packed line's goes by packs (the existing whole-units test for chicken changes); `stepHave` with a step (a 1 kg pack: 1.8 kg, one pack, back to the menu) and without one (as before); the cart still adds `packs` units per sku.

## Check
`npm test`, `npx tsc -b`, `npm run lint`, `npm run build`. In `npm run dev:fixture`, List tab at 390 px: 100 g less boniato lowers its price, the store's total, the cost per day and the budget line in proportion; one pack less of oats lowers by one pack, and going back up to the menu clears the mark; the savings card shows only on the recommended store's tab, with the monthly figure; the order button shows on top and below, disabled at Disco and Géant; `?prices=over|old|error` still render.

## Docs
`docs/design.md` (List: rows, savings card, top order button), `docs/product.md` (the monthly projection under "How much you saved", and that food sold by weight is paid by weight, the rest by pack), and an ADR, since it changes the "whole units of sale" rule for food sold by weight.

## Not covered
- The `chat` function shares `offers.ts` and `products.ts`, so it has to be deployed after the merge (`npx supabase functions deploy chat`) for the model and the screen to quote the same numbers; a push to `main` doesn't deploy functions.
- The scraper and its idea of what is sold by weight are not touched.

## Results
- Built as planned; the decisions are in [ADR 0036](../adr/0036-food-sold-by-weight-is-priced-by-weight.md). One change from the plan: **the cart keeps pricing whole units** (`cartFor` charges `packs × the unit's price`), so its "estimado" is for what it adds, even where the list prices by weight. It also meant the cart tests didn't change.
- `npm test`: 53 tests, 3 new (`offerOf`, `stepHave` with a step, the price following the grams and the packs) and four updated for chicken, which is sold by weight: the 600 g line is $ 240 or $ 228 where it was $ 300 or $ 380, and Ta-Ta is now the cheapest store of that test. `npx tsc -b`, `npm run lint` and `npm run build` pass.
- Checked in `npm run dev:fixture` at 390 px, light:
  - Boniato (by weight): 1,75 kg is $ 121 at Disco, one tap down (it moves to 1,7 kg) is $ 117, the next (1,6 kg) $ 110, and the store tabs' totals went down by the same amounts. At Géant, 1,6 kg is $ 115.
  - Avena (a 400 g pack, 350 g needed): "1 × 400 g" at $ 79; one tap down crosses it out and the store's total drops by $ 79.
  - The savings card shows only on the recommended store's tab (Géant): "Ahorrás $ 11", "Unos $ 47 al mes" (11 × 30 ÷ 7), 352 px wide and 162 px tall at 390 px.
  - "Pedir ahora" shows on top (compact) and under the list (with its notes), disabled with "Muy pronto" at Géant.
  - Rows: the name, the product, "(menú: 1,75 kg)", then `− amount +`, with the price at the right; 101 px each, as the skeleton's rows are. `?prices=old` shows the same rows without prices.
- Ta-Ta (`?cart=tata`): the top button is the same link as the one below, to the same cart. The savings card reads "Ahorrás $ 196" and "Unos $ 840 al mes" (196 × 30 ÷ 7).
- **Open point:** at Ta-Ta the store's tab says $ 2.299 and the cart's note says $ 2.630 estimated, 14% more. The tab prices the loose produce by its grams and the cart adds whole units of it, as the store sells them to a cart. That is deliberate ([ADR 0036](../adr/0036-food-sold-by-weight-is-priced-by-weight.md)), but two different totals on one screen may confuse. The alternative is to show the cart's estimate by weight too, which understates what the cart charges.
- Not checked: a wide screen, Safari and a screen reader.
- Still to do after the merge: deploy the `chat` function.
