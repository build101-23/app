# 0016. Price catalog: one row per product per chain

- Status: Accepted (size merge rule superseded by 0023)
- Date: 2026-10-17

## Context
The AI agent needs each chain's current price for a product, with when and where it was read ([ADR 0008](0008-how-we-read-supermarket-sites.md)). The free plan's database holds 500 MB.

What the sources give ([research](../notes/price-sources-research.md)):
- Devoto, Géant and Disco share product ids, but about a third of their prices differ.
- Ta-Ta has no EAN, and a category page gives no EAN at all.
- Price history is on the [roadmap](../notes/roadmap.md), but a daily snapshot of every product would fill the database in about a month.

## Decision
Four tables, in `supabase/migrations/*_price_catalog.sql`:
- `stores`: the four chains, and the text that is the same for every product of a chain.
- `scrape_runs`: one row per chain per run, with the branch or sales channel the prices belong to (`price_context`) and counters.
- `store_products`: one row per product per chain, with the latest price.
  - What it holds: identity (the chain's id, EAN when valid, Ta-Ta's internal code), name, brand, category, URL path, package size, price, previous price and availability.
  - `unit_price`: generated, per kg, liter or unit.
  - `checked_at`, plus the run that read it.
- `price_changes`: a row when a product is first read and each time its price changes. A trigger writes it.

Saving goes through `upsert_store_products(rows)`, which holds the merge rules:
- prices always take the latest read;
- an EAN, brand or category isn't erased by a read that doesn't have it;
- a size read from the product's spec isn't replaced by one read from its name.

Access:
- Signed-in users can read all four tables.
- Nobody else can read them. As [ADR 0014](0014-client-reads-chat-function-writes.md) asks of new tables, the browser can't write them: there are no write policies, and write privileges are revoked. Only the scraper writes, with its secret key.
- The function can only be called with a secret key.

There is no table matching products across chains yet.

## Consequences
- The agent reads one table, with the price per kg, liter or unit already worked out.
- History grows only when prices change.
- Shared GDU facts are stored once per chain. At this size that costs a few MB.
- Matching across chains comes later, as its own table or column. The EAN and the shared GDU ids already allow exact matches.
- A product that leaves a site keeps its last price. Readers must look at `checked_at`.
