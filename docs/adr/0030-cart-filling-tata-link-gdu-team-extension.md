# 0030. Cart filling: Ta-Ta by link, Disco and Géant by a team extension

- Status: Accepted (the buttons moved under the list, one per selected store, by [0034](0034-list-shows-one-store-at-a-time.md))
- Date: 2026-10-18

## Context
[ADR 0012](0012-fill-carts-from-the-users-computer.md) decided to fill carts on the user's own computer: Ta-Ta by an add-to-cart link, and Disco, Devoto and Géant by a Chrome extension. That extension would answer the delivery questions from saved preferences, check each product in the user's zone, propose substitutes and run weekly.

On 2026-10-18 we integrated ordering ([plan](../plans/2026-10-18-fill-cart.md)). The goal is that the list ends up in the supermarket's cart and the user only enters their details and pays: Ta-Ta in any browser, Disco and Géant from a computer for now. Several things had changed since 0012, or came up in the work:
- The menu only picks products at Disco, Géant and Ta-Ta ([ADR 0024](0024-agent-builds-the-menu-from-real-products.md)). Devoto has no picks, so there's nothing to fill there.
- We tested Ta-Ta's link with 23 catalog products ([results](../notes/cart-handoff-feasibility.md#the-add-to-cart-link-with-catalog-products)):
  - It keeps the cart already in that browser. Each sku ends at the larger of what the cart had and what the link asks, so a second tap changes nothing.
  - It skips unknown skus and adds the rest.
  - It adds food sold by weight one unit of sale at a time, at our price.
- Automating Disco, Devoto and Géant happens inside the user's logged-in account. The chains' terms and `robots.txt` ask bots to stay out of cart and checkout, and the legal read is still [open](../notes/open-decisions.md).
- A saved menu keeps its product picks for weeks. Nothing dropped a pick once the store stopped listing it, although [ADR 0024](0024-agent-builds-the-menu-from-real-products.md) says a product that leaves the site drops out of the price after 14 days.

## Decision
- **Ta-Ta: the add-to-cart link, for pilot users.** We assume it's fine for the pilot, as we did for real prices: it's a standard VTEX store feature, and the user opens it once, in their own browser. Disco and Géant have no add-to-cart link and keep carts only for logged-in users ([note](../notes/cart-handoff-feasibility.md#disco-devoto-géant-gdu-blazor-server)), so Ta-Ta is the only chain filled this way.
- **Disco and Géant: an unpacked Chrome extension on the team's computers.** It stays there until the legal read. Devoto is out.
- **The buttons go in the List tab's "Dónde comprar" card:**
  - "Armar carrito en {store}", one per store of the chosen option that this computer can fill;
  - "Armar todo en Ta-Ta · $X · faltan N", when that adds something the option's buttons don't;
  - a muted line for the stores the computer can't fill, whose products keep their links in the list.
  - The store rule doesn't change to favor stores we can fill.
- **What goes in:**
  - Each line left to buy, in the units of sale the list already shows. Two items that picked the same product become one line.
  - Food sold by weight only at a chain where a test showed what a quantity means. Ta-Ta passed; Disco and Géant wait for their test.
  - Under each button, what goes in, an estimated total without delivery, and what stays out and why.
- **The 14-day rule now applies to saved picks.** A pick whose row is more than 14 days older than its store's newest read counts as not sold there. That's the same window search uses at pick time. The List tab and the chat function both drop those rows when they read the picks, so the price, the cart and `save_menu`'s checks agree.
- **Nothing is ever removed from a supermarket cart.** The Ta-Ta link already works that way. The extension raises each of our products to at least our quantity and leaves the rest alone.
- **Changes to 0012:**
  - The extension asks nothing up front. The first time, the user answers the chain's own delivery dialog, and the extension waits. The chain remembers the answers, so we store no address or branch.
  - The weekly run, the check of each product in the user's zone, and substitutes are deferred, and so are phones for Disco and Géant.
- **No interest-only "Order it for me" button, and no events for it in this work.** The button now fills the cart.

## Consequences
- In any browser, a list bought at Ta-Ta goes into that browser's Ta-Ta cart with one tap, and checkout stays with the user.
- Opening the link while logged in to Ta-Ta, and logging in after it fills a cart, are untested: VTEX may keep, merge or replace that cart ([note](../notes/cart-handoff-feasibility.md#ta-ta-vtex)).
- The list's total and the cart total still differ:
  - Prices move between scraper runs. In the test, 8 of 23 had moved a day later, and the total was 0.4% off.
  - Delivery is extra.
  - Availability in the user's zone shows only in the supermarket's cart.
- Pilot users can't fill Disco or Géant carts yet. When either chain is the cheapest, they get the Ta-Ta alternative or the product links.
- The `chat` function and the web app read the 14-day rule through `store_newest()`. If that can't be read, nothing is dropped.
- A partial scraper run moves a store's newest read forward, so products that run skipped can look delisted after 14 days. Search already had this. Full runs at least weekly avoid it ([development.md](../development.md#price-scraper)).
