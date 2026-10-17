# 0015. The price scraper is a Python job with a time budget

- Status: Accepted
- Date: 2026-10-17

## Context
[ADR 0003](0003-price-sources.md) makes supermarket websites the main price source, and [ADR 0008](0008-how-we-read-supermarket-sites.md) sets how we read them: at most 1 request per second per site. The [spike](../notes/price-scraping-feasibility.md) proved Devoto, Géant, Disco and Ta-Ta can be read. Where the scraper runs, and in what language, was [open](../notes/open-decisions.md).

Probing the full catalogs ([research](../notes/price-sources-research.md)):
- Ta-Ta: about 13,000 products, readable in a few minutes through its search.
- Devoto, Géant and Disco share one catalog of about 68,000 products. A product page is one request, so a full read takes about 19 hours per chain.
- Their category and brand pages give the top 12 products of a category or brand in one request.
- In the first run, Devoto answered 403 after 221 requests. The last ones were product pages, a quarter of them for products Devoto doesn't carry.

The demo needs as many products as possible from each chain, even if they aren't the same products everywhere, and a run that takes 30 minutes at most.

Options considered:
- TypeScript in Supabase Edge Functions, triggered by `pg_cron` in batches of 150 s or less. Everything stays in Supabase, but it needs a rewrite of the spike's parsers and a queue in the database.
- A Python job, reusing the spike's tested parsers.

## Decision
- The scraper is a Python 3.13 package in `scraper/`. For now it's run by hand from a dev machine (`python -m scraper`).
- Each run has a time budget (25 minutes by default). Each site is read in its own thread, at 1 request per second per site.
- **Coverage:**
  - Ta-Ta: the whole catalog except clothing, one category at a time.
  - Devoto, Géant and Disco read only listing pages, 12 products per request, never a page per product:
    - first, the top 12 products of every supermarket category;
    - then the page of every brand seen there, the same brands at the three chains. A brand with 12 products or fewer comes whole.
  - The three share one platform: when one of them blocks us, the other two stop as well.
- It writes through Supabase's REST API with its own secret key, named `scraper`. The only write is the `upsert_store_products` function, which holds the merge rules ([ADR 0016](0016-price-catalog-one-row-per-product-per-chain.md)).

## Consequences
- The spike's parsers and tests carry over. The repo now has two languages: TypeScript for the app, Python for the scraper.
- The GDU catalog is partial on purpose: products that are neither in a category's top 12 nor in their brand's top 12 are missing, and nothing gives them a GTIN. The three GDU chains still share product ids, so the same product matches across them.
- Products found only through a brand page have no category, and some brands bring non-food products.
- Prices age between runs. How often to run it is still [open](../notes/open-decisions.md).
- Running it needs the scraper's secret key in `scraper/.env.local`. A scheduled runner (for example GitHub Actions) would keep the key in its own secrets instead.
- There are still no servers of our own ([ADR 0004](0004-vite-react-supabase-claude.md)): it's a job run by hand.
