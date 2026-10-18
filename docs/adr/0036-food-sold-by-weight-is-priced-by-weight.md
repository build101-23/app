# 0036. Food sold by weight is priced by weight

- Status: Accepted
- Date: 2026-10-18

## Context
[ADR 0023](0023-scraper-prices-for-the-unit-of-sale.md) and [ADR 0024](0024-agent-builds-the-menu-from-real-products.md) price the list in whole units of sale: what you'd add to the cart, with the leftover paid for. For a pack that's right. For food the store sells by weight (loose fruit and vegetables, meat), the unit of sale is a piece or a tray whose final weight, and so price, the store sets per kilo. Two things went wrong on the List tab ([plan](../plans/2026-10-18-list-savings-and-steps.md)):
- Lowering what to buy moves by 100 g, but a kilo of sweet potato still costs the same for 1.8 kg and for 1.1 kg: the price only changed when the amount crossed a whole kilo, so lowering it looked like it did nothing.
- The estimate for loose food overstated what the shopper pays, since they pay the weight they take.

Options considered:
- **Keep whole units for everything.** Rejected: it's the behavior that looked broken.
- **Decide by the catalog's section** (produce and meat by weight). Rejected: the stores decide what they sell by weight, product by product, and `store_products` already says so (`size_source = 'unit'`, the rows `offerOf` flags `weighed`).
- **By weight where the store sells by weight, by pack elsewhere.** Chosen.

## Decision
- `offerOf` sets `by_weight` on the offers it already flags `weighed`, and `cost()`, which already supported it, charges `amount × price ÷ base_qty` for them, in whole pesos. Packed food is costed as before, in whole packs. Every number that comes from `pricing()` follows: the store totals, the store rule, the budget line, the per-day cost, the saving, the chat's list card and the verdict the chat model reads.
- On the List tab, − and + move food sold by weight by 100 g (10 g under 100), as before, and now change its price in proportion. Packed food moves by one pack of the selected store (`stepHave` takes an optional step), so every tap changes what's paid. The line shows the weight, or the packs, between the buttons.
- **The cart is unchanged:** it adds whole units, so its estimate is units × the unit's price, even for weighed food. The store still decides the final weight.

## Consequences
- Totals for food sold by weight are lower than before and closer to what's paid; they can still differ from the cart's estimate, which is for whole pieces and trays.
- Food sold by weight is priced from the store's per-kilo price: a store whose price per kilo is wrong in `store_products` now shows a proportionally wrong price instead of a whole-tray one.
- The `chat` function shares `offers.ts` and `products.ts`, so it has to be deployed after this change for the model and the screen to quote the same numbers.
