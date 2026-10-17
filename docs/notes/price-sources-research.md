# Price sources research

Research for [ADR 0003](../adr/0003-price-sources.md), done on 2026-10-17. The spike that tests it lives in `spikes/supermarket-prices/` ([plan](../plans/2026-10-17-price-scraping-spike.md)); results are in [price-scraping-feasibility.md](price-scraping-feasibility.md). How we read sites: [ADR 0008](../adr/0008-how-we-read-supermarket-sites.md).

## Sources

| Source | Verdict | Why |
| --- | --- | --- |
| Devoto, Géant, Disco | Viable | Server-rendered pages with JSON-LD and a valid EAN |
| Ta-Ta | Viable | Public GraphQL query the site itself uses; no EAN |
| Tienda Inglesa | Blocked | Cloudflare challenge (403) for non-browser clients |
| Cabacuá | Not usable | Terms forbid scraping and building comparators |
| El Dorado | Not researched | |

### Devoto, Géant and Disco (Grupo Disco Uruguay)
- Blazor Server (.NET) with prerendered HTML. No longer VTEX.
- `robots.txt` only restricts cart, checkout, account and login. `/sitemap.xml` points to two sitemaps with about 68,000 `/product/<slug>/<id>` URLs and 706 `/products/category/<slug>/<id>` URLs (about 10 MB).
- The three sites' sitemaps list the same group catalog (checked 2026-10-17: Géant and Disco list 68,067 and 68,098 ids, all of them in Devoto's). It isn't each chain's own range. `lastmod` falls on a few bulk dates (9,130 products on 2026-09-08), so it can't tell which products changed.
- Category ids grow two digits per level: department `10` (almacén), category `1010`, leaf `101013` (arroz). There are 597 leaves. 125 of them are in the supermarket departments: almacén 10, bebidas 11, perfumería y limpieza 12, frescos 14, mascotas 15. The rest are hypermarket departments (TV, furniture, clothing...).
- Product page: `<script type="application/ld&#x2B;json">` (the `+` is escaped) with `name`, `brand`, `sku`, `gtin` (valid EAN-13), `offers.price`, `priceCurrency`, `availability`.
- In the HTML: previous price in `div.before span.val`, current price in `div.text span.val`, promo labels in `div.det-labels`, size in the `det-especs` table (row "Contenido"), category breadcrumb.
- The first request answers 302 and sets a branch cookie: follow redirects and keep cookies.
- Prices are for the default branch given to anonymous visitors: Devoto Fresh Market Portones, Géant Parque Roosevelt, Disco Fresh Market Plaza Italia.
- The three chains share SKU ids and EANs. Prices are usually the same, but about a third differed in the spike, mostly at Géant ([feasibility](price-scraping-feasibility.md#gdu-prices-are-not-identical)).
- A category page (`/products/category/<slug>/<id>`) prerenders its top 12 products by relevance: id, name, brand, price and the "Agregar" button, plus the category's product count and the branch in the header. The rest load interactively. URL paging (`?page=2` and similar) is ignored, and an unknown id answers 200 with no products. The top 12 can differ between chains (2 of 12 in "Aceites" on 2026-10-17).
- A brand page (`/products/brand/<id>`) works the same way: the brand's top 12 and its product count ("BLUE PATNA": 29). Every card links to its brand's page, and about 575 brands show up in the supermarket categories' top 12s.
- So a full read is one product page per product, about 19 hours per chain at 1 request per second. The scraper reads category and brand pages, and product pages only for foods those miss ([ADR 0018](../adr/0018-gdu-listings-and-food-pages.md)).
- **Devoto blocked us** on 2026-10-17 with a 403, after 221 requests in 6 minutes: 125 category pages, then 95 product pages, 26 of them for products Devoto doesn't carry. Géant and Disco, read in parallel the same way, weren't blocked; they were stopped by hand. The block was gone 11 minutes later: one category page answered 200. Since then product pages are read only for foods the listings miss, one every 2 seconds, and a block at one of the three stops the other two.
- With category and brand pages, a run takes 632–715 requests and about 12 minutes per chain, with no blocks (2026-10-17): Devoto 4,209 products, Géant 4,534, Disco 4,622. That's 5,406 different products, 3,510 of them at all three chains.
- Those listings missed whole foods the menu uses: 21 of its 54 foods had fewer than 3 options at some GDU chain (no bananas, no nalga, two kinds of oats). One run of food product pages (`--phases food`, about 430 requests per chain at one every 2 seconds, 15 minutes, 11–19 not found, no blocks) added about 420 products per chain and left 1: tart crusts, which GDU doesn't sell online. Devoto 4,624, Géant 4,953, Disco 5,042.
- Meat and produce mostly carry the weight in the name ("Bife ... x 500 g"). Some say "x Peso" and give no size.
- Terms load in an iframe from `gdumicrosites-f5d48bccb2d6.herokuapp.com/terminos-y-condiciones`, one text for the three chains. Status in [open decisions](open-decisions.md).
- Some products have no GTIN in the JSON-LD, and some show a placeholder price of $0 or $1 ([feasibility](price-scraping-feasibility.md#what-the-data-looks-like)).

### Ta-Ta
- VTEX FastStore (Gatsby), account `tatauy`. `robots.txt` allows everything except `/checkout/*`.
- About 13,000 products (12,993 on 2026-10-17), in 38 departments.
- Listings come from a persisted GraphQL query (unauthenticated GET), the same the browser makes:
  `https://www.tata.com.uy/api/graphql?operationName=ProductsQuery&variables=<JSON>` with `first`, `after`, `sort`, `term` and facets `channel` (`{"salesChannel":"4","regionId":""}`, the anonymous default) and `locale` (`es-uy`). Category facets `category-1/2/3` also work.
- Each node has `name`, `brand.name`, `sku`, `slug`, `offers.offers[0].price`, `listPrice`, `availability`, `categoriesIds`, `measurementUnit` and `unitMultiplier`. Public URL: `https://www.tata.com.uy/<slug>/p`.
- Pages hold up to 100 products (`first`) and give `pageInfo.totalCount`. Asking past about 2,500 results fails with HTTP 500, so the whole catalog is read one category at a time. Facets take the category slugs: `category-1` = `almacen`, `category-2` = `desayuno`. Sorting by `name_asc` keeps paging stable.
- The category tree is public at `https://secure.tata.com.uy/api/catalog_system/pub/category/tree/3`, on the checkout host, whose `robots.txt` allows everything. It's not served on `www`.
- Sold by weight (meat, produce): `measurementUnit` is `kg`, and the price is for `unitMultiplier` kg, which can differ from the weight in the name. For example, "Aguja Sin Hueso En Trozo 780 G" costs $346.51 for 0.827 kg.
- Some names use "Cl" for milliliters ("750 Cl" for a 750 ml bottle), so centiliters aren't read as a size.
- Clothing (`textil`, 1,204 products, many out of stock at a placeholder $0) isn't read.
- `gtin` is an internal code (for example `1000050592`), not an EAN: match Ta-Ta by brand, name and size.
- `quantity: 10000` is a VTEX cap, not real stock: keep only availability.
- Terms (clause 12) forbid reproducing design, images and code for commercial use. No specific clause on automated extraction. Don't store images.

### Tienda Inglesa
- 403 with a Cloudflare challenge ("Just a moment…") for HTTP clients. We don't try to get around it.
- `robots.txt` disallows `/busqueda?*` and `/*.categoria?*`.
- Legitimate options: ask the chain for access or a feed.

### Cabacuá
- `cabacua.com/product` pages only show an aggregated range (`AggregateOffer` with `lowPrice`, `highPrice`, `offerCount`), not the price per chain.
- Per-chain prices come from `api.cabacua.com`, which we don't call.
- Terms (in force since 2026-05-21, clause 14) forbid automated extraction and using the data to build comparators without permission.
- They sell a paid B2B product (MarketScan) with CSV export. The only legitimate path is a data license.

## Matching across chains

Compare the same product first. When a chain doesn't have it, show the most similar one, marked as a substitute and never presented as identical.

| Level | Rule | Shown as |
| --- | --- | --- |
| `exact_gtin` | Same EAN | Same product |
| `exact_sku` | Same SKU id at Devoto, Géant or Disco (they share ids; some products have no EAN) | Same product |
| `exact` | Same normalized brand + same base size (g, ml or units, pack included) + same type tokens | Same product |
| `review` | Same brand and size but only partial similarity, or a product that fits several groups | Not joined automatically; goes to review |
| `substitute` | No exact match in that chain: same type and variant, brand and/or size may change | "Similar", compared by price per kg/L/unit, with the reason |

Non-negotiable rules:
- A substitute never differs in critical tokens: whole/skim/lactose-free, integral, light, flavor, salt-free, organic, in oil/natural, parboiled/white, and similar.
- Different sizes are compared only by unit price, never by shelf price.
- The lowest observed price is computed separately for exact matches and for substitutes.

What counts as "most similar" is still [open](open-decisions.md).

## Data rules
- Never invent data: fields the source doesn't give stay empty.
- A price of $1 or less is a placeholder, not a price: drop it and keep the raw value in `notes`.
- Size comes from the product spec ("Contenido") and, if missing, from the name. If the name has two different measures, the size stays empty.
- Every offer keeps `source_url`, `product_url`, `extracted_at` and `price_context` (branch or sales channel).

## Catalog fields

Decided in [ADR 0016](../adr/0016-price-catalog-one-row-per-product-per-chain.md). The columns are in `supabase/migrations/20261017210540_price_catalog.sql`. For the record, these are the fields the spike wrote:

| Field | Type | Notes |
| --- | --- | --- |
| `store_key`, `store` | text | `devoto`, `geant`, `disco`, `tata` |
| `product_name`, `brand` | text | As the store shows them |
| `store_sku` | text | Store's product id |
| `store_code` | text | Ta-Ta internal code |
| `gtin` | text | EAN-13, only when the check digit is valid |
| `price`, `previous_price` | numeric | UYU; `previous_price` only when higher than `price` |
| `currency` | text | |
| `promo_labels` | text | |
| `size_text`, `size_source` | text | `size_source`: `spec` or `name` |
| `size_qty`, `size_unit`, `pack_count` | numeric, text, int | |
| `base_qty`, `base_unit` | numeric, text | Total content in g, ml or units |
| `price_per_kg`, `price_per_l`, `price_per_unit` | numeric | Only when size is known |
| `availability`, `category` | text | |
| `price_context` | text | Branch or sales channel the price belongs to |
| `product_url`, `source_url`, `source_method` | text | |
| `basket_key` | text | Spike only |
| `extracted_at` | timestamptz | Montevideo time |
| `notes` | text | Inconsistencies found while parsing |

## Storage estimate

Measured on 2026-10-17, after loading all four chains: 25,139 products take 9.1 MB in `store_products` (about 360 bytes each, indexes included), and their prices 3.4 MB in `price_changes` (about 135 bytes each). The whole database is 24 MB of the free plan's 500 MB.

The estimate made before, from the spike's offers: about 180 bytes of catalog data per product, roughly 0.5 KB with Postgres row overhead and indexes, and about 100 bytes per stored price snapshot.

- Every chain's whole catalog fits in the free plan's 500 MB database. The full GDU sitemap (68,700 products, food and non-food) for three chains plus Ta-Ta is about 120 MB. Food and groceries only is about 50–60 MB.
- Price history is what fills it. A daily snapshot of 120,000 products is about 12 MB a day, so the database would be full in about a month.
- So keep the current price in the products table and add a history row only when a price changes. Store fixed text (source URL, branch, method) once per store, not in every row. In the spike, Ta-Ta's source URL alone took 280 bytes per offer.

## Where scraping should run

Prices are stored in Supabase ([ADR 0004](../adr/0004-vite-react-supabase-claude.md)). Real prices come after the fake prices of milestone 5 ([milestones](milestones.md)); the fields above can shape that seed so the switch is easy.

The limit is wall-clock time, not CPU: the spike's full run took 234 s but only 1.6 s of CPU, and extracting the GDU sitemap took 15 ms ([feasibility](price-scraping-feasibility.md#run)). A full catalog takes hours at 1 request per second. Supabase Edge Functions ([limits](https://supabase.com/docs/guides/functions/limits)) allow 2 s of CPU per request, 150 s of wall clock on the free plan (400 s on paid plans) and about 256 MB of memory, and they can't run a browser. The options are:
- Edge Functions in small batches, triggered by `pg_cron`: stays inside Supabase, but needs a queue that remembers where each run stopped.
- A Cloudflare Worker with a Cron Trigger, since we already host there ([ADR 0005](../adr/0005-cloudflare-workers.md)): also batches, and its CPU and time limits per plan need checking.
- A scheduled job outside both (for example GitHub Actions on the Tenki runners planned for CI) that writes into Supabase with the secret key: simplest for long runs, but ADR 0004 says "no servers of our own", so it needs a decision.

Decided in [ADR 0015](../adr/0015-price-scraper-python-job-with-time-budget.md): a Python job, run by hand for now, with a time budget instead of a full read. Where it runs on a schedule is still [open](open-decisions.md).

## Running the spike

From `spikes/supermarket-prices/`:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

```bash
.venv/bin/python -m unittest
```

```bash
.venv/bin/python run.py --limit 2
```

Without `--limit` it reads the full basket (about 5 minutes). `--stores devoto,tata` picks chains, and `--refresh-sitemap` ignores the 24-hour sitemap cache. Outputs go to `data/out/` (git-ignored): `offers.json`/`.csv`, `comparison.csv`, `review.csv` and `run_report.json`.
