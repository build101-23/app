# 0015. The price scraper is a Python job with a time budget

- Status: Accepted
- Date: 2026-10-17

## Context
[ADR 0003](0003-price-sources.md) makes supermarket websites the main price source, and [ADR 0008](0008-how-we-read-supermarket-sites.md) sets how we read them: at most 1 request per second per site. The [spike](../notes/price-scraping-feasibility.md) proved Devoto, Géant, Disco and Ta-Ta can be read. Where the scraper runs, and in what language, was [open](../notes/open-decisions.md).

Probing the full catalogs ([research](../notes/price-sources-research.md)):
- Ta-Ta: about 13,000 products, readable in a few minutes through its search.
- Devoto, Géant and Disco share one catalog of about 68,000 products. A product page is one request, so a full read takes about 19 hours per chain.
- Their category pages give the top 12 products of a category in one request.

The demo needs a wide catalog, and a run that takes 30 minutes at most.

Options considered:
- TypeScript in Supabase Edge Functions, triggered by `pg_cron` in batches of 150 s or less. Everything stays in Supabase, but it needs a rewrite of the spike's parsers and a queue in the database.
- A Python job, reusing the spike's tested parsers.

## Decision
- The scraper is a Python 3.13 package in `scraper/`. For now it's run by hand from a dev machine (`python -m scraper`).
- Each run has a time budget (25 minutes by default). Each site is read in its own thread, at 1 request per second per site.
- **Coverage:**
  - Ta-Ta: the whole catalog, one category at a time.
  - Devoto, Géant and Disco, first: the top 12 products of every supermarket category.
  - Then product pages, until the budget runs out:
    - first the products another of the three chains listed, so the three stay comparable;
    - then more products of the food types already seen.
    - The three chains read the same products.
- It writes through Supabase's REST API with its own secret key, named `scraper`. The only write is the `upsert_store_products` function, which holds the merge rules ([ADR 0016](0016-price-catalog-one-row-per-product-per-chain.md)).

## Consequences
- The spike's parsers and tests carry over. The repo now has two languages: TypeScript for the app, Python for the scraper.
- The catalog is partial on purpose. Each run refreshes the top products and adds more. Products read from their own page in earlier runs are re-read only after new ones.
- Prices age between runs. How often to run it is still [open](../notes/open-decisions.md).
- Running it needs the scraper's secret key in `scraper/.env.local`. A scheduled runner (for example GitHub Actions) would keep the key in its own secrets instead.
- There are still no servers of our own ([ADR 0004](0004-vite-react-supabase-claude.md)): it's a job run by hand.
