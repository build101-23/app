# 0024. The chat agent searches real products and builds the menu from them

- Status: Accepted
- Date: 2026-10-17

## Context
The list was priced with example prices ([ADR 0019](0019-example-prices-until-matched.md)), and the chat model saw no prices ([ADR 0022](0022-list-follows-the-menu.md)). The scraper fills `store_products` with about 22,000 real products from Disco, Géant and Ta-Ta ([ADR 0016](0016-price-catalog-one-row-per-product-per-chain.md)), but nothing linked a menu food to them ([plan](../plans/2026-10-17-agent-builds-menu-from-products.md)).

We wanted the menu built on what the stores sell, a list that fits a budget when the user gives one, and an agent that says when it can't meet a requirement.

Name rules alone can't tell what counts as a food: "pechuga" finds turkey breast and cooked deli slices, and "lentejas" finds canned ones.

Options considered:
- **A reviewed food → product mapping file**: fast, but someone curates it, and it reads as hardcoding.
- **A second model that matches foods to products after each scrape**: no per-chat cost, but another moving part, and nothing per user.
- **The chat model searches and picks while it builds the menu**: one agent, judgment per user and budget, a longer turn.

For search:
- **The Supabase MCP**: arbitrary SQL over every user's data, so not in production.
- **Embeddings**: rank "pechuga de pavo" right next to "pechuga de pollo", and need a second model plus a reindex after every scrape.
- **Postgres text search**: the model writes the terms and judges the results.

## Decision
- **The chat model (Sonnet) builds the menu from real products:**
  1. It calls a read-only `search_products` tool once with every query it needs: two or three Spanish queries per food, the generic name and the cuts or forms it's sold as.
  2. It builds the recipes from what it found.
  3. `save_menu` carries, for each list item, the `store_sku` it picked at each store (or null).
- **Search** is the `search_products(q, lim)` RPC:
  - Spanish full-text search without accents, plus trigram word similarity;
  - over Disco, Géant and Ta-Ta, with prices, not out of stock, and read within 14 days of the store's newest read;
  - `security invoker`, for signed-in users.
  - The tool returns one short line per product: what one unit of sale is, its price, and the price per kg, L or unit.
- **The code does the arithmetic** (`_shared/offers.ts`, shared by the List tab, the chat's list card and the function):
  - each picked product is priced in whole units of sale ([ADR 0023](0023-scraper-prices-for-the-unit-of-sale.md));
  - the store rule runs on them;
  - the total is judged against the budget.
- **`save_menu` checks** that every list item has a product sold at that store in the item's unit (g and ml stand in for each other). Then it answers with the price:
  - the cheapest option and each store's total;
  - what isn't priced;
  - whether it fits the budget, and if not the five costliest items.
  - The list tools answer with the same line. The model quotes only those numbers.
- **`save_menu` isn't a strict tool any more.** With the products added, the strict grammar of all the tools went over the API's cap (a 400 on every request). Its shape is checked in code (`menuShapeProblems`) before the menu checks, and the model gets a fix list like any other "Not saved".
- **The menu covers 1 to 7 days**, the ones the user asks for ("para el finde"); without that, the whole week.
- **`budget`** is pesos for that shopping, saved in the menu, and only when the user gives one. Over budget, the model:
  - suggests the split if it fits;
  - otherwise swaps foods or products within the plan once, never cutting amounts;
  - then says how much is missing.
  - With room, it prefers known brands.
- **Turns:** up to 6 model calls per turn. After 100 s the next call goes without tools: the function stops at 150 s, and a cut-off turn stores nothing. Each call's tokens and time go to the function's logs.
- Devoto stays out ([ADR 0019](0019-example-prices-until-matched.md)).
- **Hackathon:** the legal read of showing real prices is assumed. It is required before a real launch.

## Consequences
- Menus only use foods the stores sell, and the List tab shows each line's product, store, cost and link. The cart step can reuse each product's sku ([ADR 0012](0012-fill-carts-from-the-users-computer.md)).
- **Estimated cost:** about US$0.10 for a turn that builds two days, US$0.20 to 0.30 for a week. The logs measure it. A search cache, or a second cheaper model, are the next levers if cost or time grows.
- **The model now sees prices and totals.** That supersedes ADR 0022's "never prices". It sees them as catalog keys and pesos, never scraped product names.
- **Prices change with each scrape, but the picks don't.** A product that leaves the site drops out of the price after 14 days, until the next `save_menu`.
- **Menus saved before this have no products.** The List tab asks to rebuild them through the chat.
- A bigger `save_menu` input, and the search results, stay in the chat's history (cached).
