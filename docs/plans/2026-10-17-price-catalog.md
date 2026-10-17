# Price catalog: real supermarket prices in Supabase

## Context
Both spikes are merged into `main`. The next step toward the real MVP is to fill Supabase with real products and prices from Devoto, Géant, Disco and Ta-Ta, so the AI agent can use them later. This plan only reads the sources and loads the database. Matching across chains, search indexes and the agent's tools are out of scope.

**The data model doesn't exist yet.** The research note has a *proposed* field list ("the schema is not decided"), and the database only has `conversations`, `messages` and `profiles`. This plan defines the model.

Decided in chat:
- The scraper is **Python**, run by hand from a dev machine for now. Scheduling it comes later.
- **One run takes 30 minutes at most** and brings a wide catalog for the demo, not every product.
- New branch from an updated `main`.

Probed on 2026-10-17 (about 30 requests, 1 req/s, honest User-Agent):
- **GDU.** The three chains' sitemaps list the same group catalog: about 68,000 product ids, plus 706 category pages (597 leaves). `lastmod` falls on bulk dates, so it can't tell which products changed. A full read is one product page per product (about 19 h per chain at 1 req/s), which doesn't fit.
- **GDU category pages** (`/products/category/<slug>/<id>`) prerender the top 12 products by relevance in one request: id, name, brand, price and the branch in the header. There's no URL paging. 126 leaves belong to the supermarket departments (almacén 10, bebidas 11, perfumería y limpieza 12, frescos 14, mascotas 15). The other 470 are hypermarket departments: TV, furniture, clothing and so on.
- **Ta-Ta.** 12,993 products. GraphQL `ProductsQuery` takes pages of 100, but fails after about 2,500 results, so the scraper splits by category. The tree is public at `secure.tata.com.uy/api/catalog_system/pub/category/tree/3` (38 departments, and `robots.txt` allows it). Facets `category-1`/`category-2` return a `totalCount` (Almacén is 3,093, so it gets split by subcategory). Each node also has `categoriesIds`, `measurementUnit` and `unitMultiplier`.

## Coverage within 30 minutes
Each site runs in its own thread at 1 req/s per site, as in ADR 0008. Every phase stops at the time budget (`--minutes`, default 25).
- **Ta-Ta: whole catalog.** About 1 tree request, about 45 count requests and about 135 pages, so roughly 13,000 products in about 4 minutes.
- **GDU, phase 1: category pages.** The 126 supermarket leaves at each chain give about 1,500 products per chain in about 3 minutes.
- **GDU, phase 2: product pages** until the budget runs out, about 1,200 per chain. Priority order:
  1. Ids that another GDU chain listed in phase 1 but this one didn't, so the three chains stay comparable.
  2. More food ids from the sitemap whose slug starts with a product type seen in phase 1 for almacén, bebidas and frescos (for example `arroz`, `leche`). These go round-robin by type, newest id first. Ids not yet in the database come first, then the oldest checked.
  - The three chains walk the same list, so they read the same products.
  - Product pages also add the GTIN and the "Contenido" size.
- **Result per run:** about 21,000 rows, roughly 15 MB of the 500 MB. Running it again refreshes the top products and extends coverage.

## Data model
New migration `supabase/migrations/<ts>_price_catalog.sql`.

- **`stores`**: `key` primary key (`devoto`, `geant`, `disco`, `tata`), `name`, `base_url`. The four rows are seeded in the migration.
- **`scrape_runs`**: one row per chain per run.
  - `id`, `store_key`, `started_at`, `finished_at`
  - `status`: `running` / `done` / `interrupted` / `blocked` / `failed`
  - `price_context`: the branch or sales channel, for example "Default branch for anonymous visitors: Devoto Fresh Market Portones"
  - `stats` jsonb: requests, saved, not found, no price, errors
- **`store_products`**: one product as sold by one chain, with its latest price. `unique (store_key, store_sku)`.
  - **Identity:** `id`, `store_key`, `store_sku` (the GDU product id, or the VTEX sku id that Ta-Ta's add-to-cart link uses), `store_code` (Ta-Ta's internal code), `gtin` (valid EAN-13 only)
  - **Description:** `name`, `brand`, `category` (a slug path such as `almacen/canasta-familiar/arroz`), `url_path` (appended to `stores.base_url`)
  - **Size:** `size_text`, `size_source` (`spec` / `name` / `unit`), `size_qty`, `size_unit`, `pack_count`, `base_qty`, `base_unit` (`g` / `ml` / `un`)
  - **Price:** `price` (empty for placeholder prices of $1 or less), `previous_price`, `currency`, `promo_labels`, `availability` (the schema.org value as given)
  - `unit_price`: a generated column with the price per kg, per liter or per unit, depending on `base_unit`
  - **Bookkeeping:** `read_from` (`category_page` / `product_page` / `search_api`), `notes`, `run_id`, `checked_at`, `first_seen_at`
  - Partial index on `gtin`.
- **`price_changes`**: `store_product_id`, `price`, `previous_price`, `observed_at`, `run_id`.
  - A trigger adds a row on insert and whenever `price` or `previous_price` changes. That keeps the history cheap, as the research note recommends.
- **`upsert_store_products(rows jsonb)`**: an RPC that does the bulk upsert. The merge rules live here, in one place:
  - Price fields always take the latest read.
  - `gtin`, `brand`, `store_code` and `category` keep their old value when a new read doesn't have them. A listing has no GTIN.
  - A size from the spec is never replaced by a size read from the name.
- **Access:** RLS on all four tables, with a policy that lets `authenticated` users read. There are no write policies, because only the scraper writes, with a secret key that bypasses RLS.
  - Both functions use `set search_path = ''`.
  - `upsert_store_products` gets `revoke execute ... from public, anon, authenticated` and is granted only to `service_role`.

## Steps
0. Run `git switch main && git pull --ff-only && git switch -c feat/price-catalog`. Save this plan as `docs/plans/2026-10-17-price-catalog.md`.
1. **Migration**: write the SQL above.
   - The project isn't linked on this machine, and linking needs the database password from the vault. So you run `npx supabase link --project-ref eqqrqkgabfjhfynsuwzj` and `npx supabase db push` in your terminal.
   - This can happen while step 2 is underway.
2. **`scraper/` package** (Python 3.13, `requests` only, local `.venv`, `.gitignore` for `.venv/`, `data/` and `__pycache__/`).
   - The spike stays untouched as a record. The tested code from it is copied and adapted here, not imported.
   - `fetch.py`: `PoliteSession` and `BlockedError` from `spikes/supermarket-prices/common.py`.
     - One session per site.
     - The User-Agent names the project and its URL.
     - No retries on 401/403/429 or challenge pages.
   - `sizes.py`: `parse_size`, `unit_price`, `valid_gtin`/`gtin13`, `norm_text` and `drop_placeholder_price`, from the spike's `common.py`.
   - `gdu.py`:
     - The sitemap is read once from Devoto and cached for 24 h in `scraper/data/cache/`. It gives the product ids, slugs and the category tree, read from the hierarchical ids (2, 4 and 6 digits).
     - Category page card parser: id, name, brand, price, "before" price, labels, button text (shown as "Agregar"), and the branch from the header.
     - Product page parser: `parse_product_page` from the spike's `scrape_gdu.py`. The category comes from the breadcrumb hrefs.
     - Row builders.
   - `tata.py`:
     - The tree from the secure host.
     - A partition planner that adds `category-2` facets until each partition holds 2,500 or fewer results.
     - Paging with `first` set to 100 and `sort` set to `name_asc`, which keeps the order stable. The scraper checks that the unique SKUs match `totalCount`.
     - The category comes from `categoriesIds` through the tree.
     - Size from the name, or from `measurementUnit`×`unitMultiplier` for kg/g/l/ml (`size_source` `unit`).
     - When `hasMulticurrencyPrice` is set, `currency` stays empty and a note explains why.
   - `db.py`: Supabase REST with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, read from the environment or from `scraper/.env.local`, which root `*.local` already ignores. It:
     - creates and finishes runs
     - calls the RPC in batches of 500
     - pages through each store's existing `(store_sku, checked_at)` rows
   - `run.py` and `__main__.py`:
     - Usage: `python -m scraper [--stores ...] [--minutes 25] [--limit N] [--dry-run]`.
     - One thread per site. GDU waits for all three chains to finish phase 1 before starting phase 2.
     - Rows are flushed every 200 rows and at the end. Ctrl-C saves what it has and marks the run `interrupted`.
     - A block stops that chain (`blocked`). So do 20 errors in a row (`failed`).
     - `--dry-run` writes NDJSON to `scraper/data/out/` instead of the database.
     - At the end it prints a summary per chain.
   - `tests/` (`unittest`, with small hand-written fixtures and no copies of the sites' pages):
     - sizes
     - the GDU card and product parsers
     - the GDU category leaves and the phase 2 priority
     - the Ta-Ta partition planner and row builder
     - the batching in `db.py`, against a mocked HTTP layer
3. **Dry run**: `python -m scraper --dry-run --minutes 3 --limit 20`. Check rows from all four chains: price, size, category, `url_path`, `price_context`.
4. **Secret key**: you create a secret key named `scraper` in Supabase (Project Settings → API Keys) and paste it into `scraper/.env.local` yourself. It never goes in the chat or in a commit, and it can be revoked without touching the Edge Functions.
5. **Real run**: `python -m scraper` in the background, 25 minutes or less. Then check:
   - every row in `scrape_runs` is `done`
   - counts per chain (about 13,000 Ta-Ta, about 2,500 or more per GDU chain)
   - one row in `price_changes` per product
   - database size
6. **Docs**:
   - **ADR 0015, "The price scraper is a Python job with a time budget"**: covers where it runs (by hand for now, scheduled later), the language, how it writes (an RPC with a dedicated secret key) and the coverage strategy.
   - **ADR 0016, "Price catalog: one row per product per chain"**: covers the model, the change history and access (signed-in users read, only the scraper writes).
   - Add both to `docs/adr/README.md`.
   - `architecture.md`:
     - add the scraper component
     - add the four tables and their access
     - add a "Prices" data flow
   - `development.md`:
     - scraper setup and commands
     - the `SUPABASE_SECRET_KEY` row (in `scraper/.env.local`)
     - in the Secrets section, an exception for the scraper's own key and a note that catalog tables are read-only for signed-in users instead of having an owner policy
   - `notes/price-sources-research.md`:
     - the new GDU and Ta-Ta findings
     - replace "Proposed offer fields" with a link to ADR 0016 and the migration
     - the measured storage
   - `notes/open-decisions.md`:
     - where the scraper runs → decided, except scheduling
     - refresh frequency stays open, noting that a run takes 30 minutes or less
   - `notes/milestones.md`:
     - add "Price catalog (real prices)"
     - milestone 5 uses the real catalog instead of a fake seed
7. Commit on the branch only after your OK. No push or PR unless you ask.

## Rules kept (ADR 0008)
- 1 request per second per site and an honest User-Agent.
- No retries on blocks, and no images or descriptions.
- Unknown fields stay empty.
- Every price has `checked_at`, plus `price_context` through `run_id`.

## Verification
- `scraper/.venv/bin/python -m unittest discover -s scraper/tests -t .` passes.
- The dry run shows priced rows for all four chains, each with `url_path`, `checked_at` and `price_context`.
- After the real run:
  - SQL in the dashboard shows counts per `store_key`, all runs `done` with no blocks, and the database size well under 500 MB.
  - `set role authenticated; select ... from store_products` works.
  - The anon key (publishable) gets `[]` from `/rest/v1/store_products`.
  - Calling `rpc/upsert_store_products` with the publishable key is refused.
  - Supabase Advisors → Security shows no new warnings.
- `find . -name "*.md" -not -path "./.git/*" -not -path "*/node_modules/*"` shows nothing new outside `docs/`.

## Changed while implementing
- A teammate's migrations and ADRs landed on `main` meanwhile. The migration became `20261017210540_price_catalog.sql`, after `20261017205050_read_only_tables.sql`, and also revokes the browser's write privileges ([ADR 0014](../adr/0014-client-reads-chat-function-writes.md)). The ADRs became 0015 and 0016.
- The schema went to `main` on its own (PR build101-23/app#4), since it was already applied to the hosted project.
- Ta-Ta products sold by weight take their size from `unitMultiplier`, which is what the price is for.
- Saving to Supabase is retried when the connection drops. Requests to the supermarkets still never are.
- The first load (17,599 products) got a 403 from Devoto during phase 2, and the GDU top 12s missed whole foods. GDU now reads every category's top 12, then every brand's page, then up to 10 product pages per food the menu needs, more slowly. A block at one GDU chain stops the other two. Ta-Ta skips clothing, which was also deleted from the database ([ADR 0018](../adr/0018-gdu-listings-and-food-pages.md)).
- An automated review of the schema PR found two bugs (a size without a unit inflated `unit_price`, and a late batch could overwrite a newer price) and a wrong write-path description in ADR 0015. The fixes are a follow-up migration and ADR 0018.
