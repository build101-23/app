# 0034. The List shows one supermarket at a time

- Status: Accepted
- Date: 2026-10-18

## Context
The List tab opened with a "Dónde comprar" card. It showed:
- the store rule's recommendation, plus a two-store split to pick ([product.md](../product.md#6-save-money));
- each store's total;
- the cart buttons ([ADR 0030](0030-cart-filling-tata-link-gdu-team-extension.md)).

Each line showed its product at the store the chosen option bought it in. The user wanted something more direct ([plan](../plans/2026-10-18-store-tabs.md)): pick a supermarket by its icon, see the same list with that store's products and prices, and order it there from a button under the list.

## Decision
- **Three tabs on top of the list,** one per supermarket, in place of the card. Each tab has:
  - the chain's own icon, its name and its total for what's left to buy;
  - "N productos no encontrados" when it's missing items;
  - a "Recomendado" pill on the store the rule picks, the cheapest that has the whole list.
- **Which tab is open:**
  - The list opens on the recommended store. Without one, it opens on the store missing the fewest items, then the cheapest.
  - The pick is kept per menu version in this browser.
- **Under the tabs, for the selected store:** what its total comes to per day, the budget line, the saving (when it's the recommended store) and the date the prices were read.
- **Each line shows its product at the selected store.** A line that store doesn't sell says "No está en {store}" and isn't counted in its total.
- **"Pedir ahora en {store}" goes under the list,** for the selected store:
  - Ta-Ta: its add-to-cart link with every line left to buy there ([ADR 0030](0030-cart-filling-tata-link-gdu-team-extension.md)).
  - Disco and Géant: the button is disabled, with "Muy pronto", until their extension.
- **The List no longer offers the two-store split.** The store rule doesn't change, and neither do the chat's list card and what the chat model reads: they still recommend one store, or a split when it saves 10%.

## Consequences
- One tap shows the whole list at any store, with its products and links. The user isn't stuck with the rule's choice.
- The order button always matches what's on screen, so "Armar todo en Ta-Ta" and the per-option carts are gone.
- Buying in two stores now means opening one tab, then the other. The chat can still suggest a split the List doesn't show as one option. The learning-table question on splits ([product.md](../product.md#what-we-want-to-learn)) can't be measured in the List.
- The store icons replace the SVG logos from the previous PR.
