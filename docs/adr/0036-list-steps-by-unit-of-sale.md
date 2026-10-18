# 0036. The List steps by unit of sale

- Status: Accepted
- Date: 2026-10-18

## Context
Lowering what to buy on the List tab moved by 100 g, but the price is per whole unit of sale ([ADR 0023](0023-scraper-prices-for-the-unit-of-sale.md), [ADR 0024](0024-agent-builds-the-menu-from-real-products.md)): a bag of 1 kg of sweet potato costs the same for 1.8 kg and for 1.1 kg. So the price only moved when the amount crossed a whole kilo, and lowering it looked like it did nothing ([plan](../plans/2026-10-18-list-savings-and-steps.md)).

Options considered:
- **Price food sold by weight by its grams.** Built first, then dropped. It makes the price follow every 100 g, but the cart can only add whole units, so for the same list the store's tab said $ 2.299 and the cart's note $ 2.630 (14% more). The two numbers can't match while one counts grams and the other units.
- **Step by the unit of sale, and keep pricing whole units.** Chosen.

## Decision
- With a price, − and + move by one unit of sale of the selected store (`stepHave` takes an optional step, the offer's `base_qty`): a pack, a piece, a tray. Every tap changes what's paid, and the line is shown as what the cart adds ("2 × 1 kg"), with "(menú: 1,75 kg)" when that differs from what the menu uses.
- Without a price (not found, not at this store, prices not read), the step is the food's own, as before.
- Pricing doesn't change: the list's totals, the budget, the saving and the cart's estimate all count whole units, so the tab and the cart agree.

## Consequences
- For food sold by weight in big units (a 1 kg tray), a tap moves 1 kg. Where stores sell smaller units (250 g pieces), it moves less.
- Nothing changes in the shared pricing code the `chat` function uses, so it needs no new deploy for this.
- Pricing food sold by weight by its grams stays open as an idea, for a cart that can take fractions.
