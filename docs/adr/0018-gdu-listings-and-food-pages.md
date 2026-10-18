# 0018. The scraper reads GDU through listings and a few food pages

- Status: Accepted (food phase picks changed by 0023)
- Date: 2026-10-17

## Context
[ADR 0015](0015-price-scraper-python-job-with-time-budget.md) had Devoto, Géant and Disco read the top 12 products of every supermarket category, then product pages one by one. The first load showed three problems ([research](../notes/price-sources-research.md#devoto-géant-and-disco-grupo-disco-uruguay)):
- **Devoto blocked us** with a 403 after 221 requests. The last 95 were product pages, and 26 of them were for products Devoto doesn't carry. The block was gone 11 minutes later.
- **Too few products:** about 1,500 per chain. A brand page (`/products/brand/<id>`) also lists 12 products per request, and most brands have fewer than that.
- **Not enough variety in food.** The category top 12s miss whole foods the menu uses: no bananas, no nalga, two kinds of oats.

The goal for the MVP is as many products from each chain as possible, food first, even when the chains don't carry the same ones. Ta-Ta's clothing is useless for a shopping list.

A review of the schema PR (build101-23/app#4) also found that ADR 0015 misstates the write path.

## Decision
- **Devoto, Géant and Disco** run three phases. Each phase starts once all three finish the previous one.
  1. **Categories:** the top 12 products of every supermarket category.
  2. **Brands:** the page of every brand seen in phase 1, the same brands at the three chains.
  3. **Food:** product pages for foods the menu needs (`FOOD_TERMS` in `scraper/gdu.py`).
     - The products are picked by the first words of their slug in the sitemap: at most 10 per food, newest first, leaving out what's already saved.
     - Foods take turns, so every food gets some if the budget runs out.
     - One request every 2 seconds instead of every second.
- `--phases` runs only some of them. For example, `--phases food` tops up food without reading the listings again.
- **When one of the three is blocked, the other two stop as well.** They share one platform, and moving on to a sister site would be getting around the block ([ADR 0008](0008-how-we-read-supermarket-sites.md)).
- **Ta-Ta skips clothing** (`textil`), and it was deleted from the catalog.
- **Write path, stated correctly:**
  - The scraper's secret key is a Supabase API key named `scraper` in the dashboard. It acts as `service_role`; there's no `scraper` database role.
  - Products are written only through `upsert_store_products`.
  - The scraper also creates and closes its own `scrape_runs` rows through the REST API.

## Consequences
- A full run reads about 715 listing pages per chain in about 12 minutes, plus up to about 500 food pages at the slower pace. Within the 25-minute budget, the food phase may need its own run.
- Products found only through a brand page have no category, and some brands bring non-food products.
- The food list lives in the scraper, beside the menu's catalog, so a food added to the menu needs adding there too.
- Product pages still risk a block. The slower pace, the cap per food and the shared stop keep that risk small, and a block only costs that run.
