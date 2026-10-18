# The chat agent builds the menu from real products

Status: **in progress**. It finishes milestone 5's open sub-item in [milestones](../notes/milestones.md) ("Price the list from the catalog"), the hackathon version. Branch `feat/real-prices`, cut from `main` after pulling (it includes build101-23/app#8, #9 and #11: ADRs 0021 and 0022 are taken, the scraper session takes 0023). Step 1 saves this plan as `docs/plans/2026-10-17-agent-builds-menu-from-products.md`.

## Context
- The List tab prices the list with made-up prices ([ADR 0019](../adr/0019-example-prices-until-matched.md)), and the chat can't see prices.
- The scraper fills `store_products` with real products (Disco 5,042, Géant 4,953, Ta-Ta 11,774), but nothing links the menu to them.

What the user asked for (2026-10-17):
- **The chat's Sonnet does it all, like a person would:**
  1. it takes your restrictions, likes and goal;
  2. it **searches the products available in the database** ("pollo" → pechuga, suprema, muslo; never turkey or breaded);
  3. from what it found, it **builds the dishes and the list** with recipes it knows.
  - There's no pre-mapping and no second model.
- **Shorter shopping:** the days the user asks for ("para el finde", 2 days), so the turn is faster.
- **Budget:** when the user gives one, the list fits it. With room, Sonnet picks leading brands; when it can't fit, it says how much is missing.
- **Cart and zone availability come later** ([ADR 0012](../adr/0012-fill-carts-from-the-users-computer.md)). Each line keeps its `store_sku` and URL.
- **Hackathon:** we assume showing real prices is fine. The legal read stays open for a real launch.

**Cost and time** (estimate; it's measured in verification):
- Sonnet 5.5 costs $2 per million input tokens ($0.20 cached) and $10 per million output.
- A turn that builds a 2-day menu with searches has 2 or 3 rounds, about 8k tokens of results and about 6k of output: **about US$0.10**. A full week costs about US$0.20 to 0.30. A normal reply costs 1 to 3 cents.
- Speed comes from:
  - **every search in one tool call**;
  - compact results;
  - short menus;
  - the code doing the arithmetic.
  - That should give about 30 s per turn with 2 days.
- No Supabase MCP in production (arbitrary SQL over every user's data), and no embeddings yet: Postgres text search plus Sonnet writing the terms and judging the results is enough for 22k short names.

**Data problems that must be fixed first** (scouting and live checks), or Sonnet would compare wrong prices:
- GDU weighable prices: off by 0.5× to 10×.
- GDU per-piece products.
- Ta-Ta pieces over 1 kg.
- GDU fresh produce (tomato `401026`) that the food phase never reads.
- Mis-encoded Ta-Ta names ("VacÃ­o").

## Flow
```
user: "no como cerdo, quiero bajar de peso; armame algo para el finde, tengo $ 1.500"
 → round 1: search_products(["pechuga pollo", "suprema", "arroz", "tomate", "huevos", "lentejas", ...])
            ← per query and store: sku | name | size | $ price | $ per kg/L/u   (one call, ~15 queries)
 → round 2: save_menu(days: [saturday, sunday], recipes with the products found, budget: 1500,
                      products: [{ food, other_name, unit, disco, geant, tata }])
            ← the code checks each product is real and in the right unit, prices the list, runs the store rule:
              "Saved. Ta-Ta $ 1.380, fits, $ 120 left" (or "over by $ 210: costliest …")
 → (over) one round of swaps, then it says what's missing
 → reply in one line; the List tab shows the same numbers with each product and its link
```

## Design

### 1. Scraper: prices for the unit of sale
- **One rule for every row with `size_source = 'unit'`:** `base_qty` is the quantity the price is for, and `size_qty`/`size_unit` is one unit of sale.
- **GDU** (`gdu.py`):
  - Detect weighable prices with `product-price-weighable` plus `<span class="val">X</span><span class="mon"> / kg</span>` (card `desc-prices`, page `det-precios`).
  - When found: `price = X`, `base_qty = 1000 g`, `size_source = 'unit'`, and the unit of sale is the name's weight (or 1 kg).
  - Product pages: the visible price wins over JSON-LD when they differ by more than $1.
  - Food phase: fresh-produce slugs (`aprox`, `x-kg`, `malla`, `bandeja`) before the newest ids.
- **Ta-Ta** (`tata.py`):
  - kg with a multiplier above 1: `base_qty = 1000`, and the multiplier is the unit of sale;
  - repair mis-encoded names (a Latin-1/UTF-8 round trip when a name has "Ã").
- **Migration `*_unit_of_sale.sql`:**
  - In `upsert_store_products`, a `spec` size is protected only against a `name` or null one: `case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.<col> else excluded.<col> end`.
  - Grants are kept.
- **Tests:** five GDU HTML fixtures (weighable card, flat card, weighable page, per-piece page, flat page), Ta-Ta multiplier above 1, the name repair, produce first.
- **Then:** `db push`, and a full run with `--stores disco,geant,tata`.

### 2. Search (migration `*_product_search.sql`)
- `unaccent` and `pg_trgm`, plus an immutable `f_unaccent(text)` wrapper.
- A GIN full-text index on `to_tsvector('spanish', f_unaccent(name || ' ' || coalesce(brand, '')))`, and a trigram index on `f_unaccent(lower(name))`.
- `search_products(q text, lim int default 5)`:
  - for disco, geant and tata, up to `lim` per store;
  - ranked by `ts_rank(websearch_to_tsquery(...))` plus trigram similarity;
  - only rows with a price and not OutOfStock, read within 14 days of their store's newest row.
  - `security invoker`, granted to `authenticated`.
- **Formatting** (`_shared/products.ts`, tested): `searchText(results)` gives compact lines grouped by query and store, with names cut at 60 characters and total output capped.

### 3. The menu carries the products (`_shared/menu.ts`)
- **`MenuData` gains:**
  - `budget: number | null`: whole pesos for this shopping, only when the user gives it;
  - `products: { food, other_name, unit, disco: string | null, geant: string | null, tata: string | null }[]`: for each list item, the sku Sonnet picked at each store, or null where it found nothing.
- **Days:** 1 to 7 distinct. The Menu tab already shows whatever days there are.
- **Catalog foods stay the vocabulary** for nutrition (ADR 0021), sections and the marks. An `'other'` food is fine if it has a product.
- **`productProblems(menu, rows)`** (pure, `_shared/products.ts`) checks:
  - every list item has an entry with at least one sku;
  - each sku exists at that store, with a price and a size in the item's unit.
  - It returns what to fix ("tomato: 401026 isn't sold at disco").

### 4. Pricing: `_shared/offers.ts` (replaces `prices.ts`)
- **Offer:** the picked product, in whole units of sale. `step` is the content of one unit in the item's unit, and `Offer = { price: price × step / base_qty, base_qty: step, sku, name, url }`.
  - `stores.ts`'s `cost()` and `planStores` are unchanged, and `Offer` gains optional fields only.
- **`needsFor(items, have)`:** what's left to buy, finite and above 0.
- **`pricing(items, have, menu.products, rows, budget)`** returns:
  - `plan`;
  - per-line offers and packs;
  - `base = single ?? split`, what the List shows by default;
  - `over = base.total − budget`;
  - `splitFits`;
  - `checkedAt`;
  - `status`.
- **`verdict(p)`:** one English line for the chat, at most 300 characters. Over budget, it adds the 5 costliest foods.

### 5. Chat (`supabase/functions/chat/`)
- **`search_products` tool** (strict):
  - input `{ queries: string[] }`, 1 to 20;
  - the RPC runs for every query in parallel, and the result is `searchText`;
  - description: "Search the supermarkets' products. Send every search you need in one call: several Spanish queries per food, the generic name and the cuts or forms it's sold as."
- **`save_menu`:**
  - the schema gains `budget` and `products`;
  - after `menuProblems`, it loads the picked rows (three `store_products` queries, with `.in('store_sku', …)` per store) and runs `productProblems`;
  - once saved, it returns "Saved." plus `verdict`;
  - it reads `have` from the upsert;
  - a pricing failure never makes a saved menu an error (the Chat tab's preview needs `!is_error`).
- **`get_prices` tool** (read-only): prices the saved menu, for later questions, with a note if it isn't confirmed.
- **`runTool` returns `{ content, is_error }`.**
- **Loop:**
  - up to 6 rounds;
  - a guard: after 110 s, the next round goes without tools (the function stops at 150 s, and a cut-off turn stores nothing);
  - each round's `usage` (input, cache read and write, output) and its time are logged to the function logs, to measure cost and time.
- **Fix `object()`** (`type: 'object' as const`; `deno check` fails today) and add `deno check`.
- **Prompt** (frozen; replaces the example-prices passage):
  - **Build the menu from what the stores sell.** Before `save_menu`, search for everything you're going to use in a single `search_products` call (two or three queries per food: generic plus cuts or forms). Then build the dishes with what you found: everyday recipes that use those products, respecting what they can't eat and what they don't like.
  - Pick plain products: never turkey for chicken, breaded, cooked, smoked, or canned when the food is fresh, unless asked. At each store, the one that fits; with room in the budget, known brands.
  - Use the product's unit, and amounts raw as bought.
  - Days: the ones the user asks for ("el finde" = Saturday and Sunday). If they don't say, 7.
  - Budget:
    - only when the user gives one; never assume it;
    - over: suggest the split if it fits; otherwise one round of swaps (cheaper products or foods the plan allows, never smaller amounts);
    - then say how much is missing.
  - If something they want isn't sold, or a requirement can't be met, say so in one line.
  - Quote only numbers from the latest `save_menu` or `get_prices`.

### 6. List tab (`src/List.tsx`)
- **Loading:** the picked rows, in parallel with the menu and outside `inTurn`. "Buscando precios…" while loading; an error leaves the list usable.
- **Price block:**
  - the store options;
  - the budget line for the chosen option ("te sobran $ 120", or the alert "No alcanza: faltan $ 210", plus "Entra si dividís entre X e Y");
  - each store's row;
  - "Precios de las webs de los súper del 17 de octubre. Pueden variar."
- **Each line:** "2 × Arroz SAMAN 1 kg · Ta-Ta · $ 118", linked to the product page (`stores(base_url)` + `url_path`). The quantity column and −/+ stay as they are.
- **A menu saved before this change** (no `products`): "Pedile al chat que arme el menú de nuevo con precios reales".
- **Strings:** new ones. `prices.sample` is deleted, and `money` moves to `strings.ts`.
- **CSS:** a column wrapper for the product line.

### 7. Removing the example prices (ADR 0019 checklist)
Delete `prices.ts` and its test, the `sample` label, the prompt passage, the `stores.ts` comments and the docs. `grep -rln "ADR 0019" src supabase` then finds nothing.

## Parallel work (asked by the user)
- **Separate session (scraper, §1):**
  - its own worktree and branch `fix/scraper-unit-of-sale`, cut from `main`;
  - the fixes and tests, the unit-of-sale migration, `db push`, and the full run with `--stores disco,geant,tata`;
  - its own small PR to `main`.
  - It touches only `scraper/`, its migration and `docs/notes/price-sources-research.md`. ADR 0023 goes in that PR.
- **This session (§2–§7)** on `feat/real-prices`:
  - `offers.ts` is written against §1's unit-of-sale rule, with fixtures, so it doesn't wait for the run;
  - the real searches are tested once the run finishes;
  - before the PR, `feat/real-prices` is updated from `main` with the scraper PR merged.
- **7 days is the goal** (the default when the user doesn't say). The 2-day menu is the first measurement. If 7 days goes over about 60 s, try lower effort on the search round and more compact results.

## Steps
1. `git pull`, create the branch, save the plan. Start the scraper session (above).
2. *(scraper session)* Scraper fixes and tests. The unit-of-sale migration, `db push`, then a full run with `--stores disco,geant,tata`. It reads the sites for up to 25 minutes, as the team has done before.
3. The search migration, `db push`. Try "suprema", "pechuga pollo", "tomate", "lentejas" and "acelga" over REST, and tune the ranking.
4. `menu.ts`, `products.ts`, `offers.ts` and their tests. Delete `prices.ts`.
5. Chat: the tools, `runTool`, the loop with its guard and the usage log, the prompt, `object()`. Deploy to the hosted project and try three menus.
6. List tab, strings, CSS.
7. Docs. Then lint, build, `npm test`, the scraper tests and `deno check`. Then the PR, merge, and `npx supabase functions deploy chat`.

### Tests (`node --test` and `unittest`, with fixtures)
- **`products.test.ts`:**
  - `productProblems`: a missing entry, all null, an unknown sku at a store, a unit mismatch, no price;
  - `searchText` format and its cap.
- **`offers.test.ts`:**
  - a 1 kg tray is bought whole;
  - a 250 g weighable piece costs whole pieces;
  - a Ta-Ta 1.4 kg piece is priced per kg;
  - the same sku at Disco and Géant keeps two prices;
  - a crossed-out item doesn't count;
  - the plan equals `planStores(needs, prices)`;
  - budget equal to the total fits, and total − 1 is over by 1;
  - single 2,100, split 1,880, budget 2,000 gives `splitFits`;
  - `checkedAt` is the oldest used;
  - `verdict` is at most 300 characters.
- **`menu.test.ts`:** 2 days valid, a repeated day invalid, 0 days invalid.
- **Scraper:** the fixtures in §1.

## Verification (deployed, after `deploy chat`)
- "No como cerdo, armame algo para el finde, tengo $ 1.500":
  - one `search_products` call, then a 2-day menu with real products;
  - the List tab shows products, links and "te sobran";
  - the chat's numbers match the List tab.
- "Quiero pollo": supremas or pechugas, never turkey or breaded. Lentejas are dry.
- "Con $ 500": one round of swaps, then "no alcanza, faltan $ X".
- From the logs: time and tokens per turn, for a 2-day menu and for 7 days. Target: about 30 s and about US$0.10 for 2 days. Write down the real numbers in the PR.
- Spot-check five lines against the sites. Database → Advisors → Security.

## Docs
- **ADR 0024, "The chat agent searches the product catalog and builds the menu from it":**
  - one narrow search tool, not the MCP;
  - text search, not embeddings, for now;
  - the products travel in the menu, and the code does the arithmetic;
  - 1 to 7 days;
  - a budget per menu;
  - 6 rounds plus the time guard;
  - the measured cost and time;
  - hackathon: the legal read is assumed.
  - Statuses: 0019 becomes "Superseded by 0024"; 0013 becomes "Accepted (seven fixed days superseded by 0024)".
- **ADR 0023, "Scraper prices for the unit of sale"** (it lands in the scraper session's PR): the GDU and Ta-Ta rules, the merge order, produce in the food phase. Status: 0016 becomes "Accepted (size merge rule superseded by 0023)".
- `docs/adr/README.md`.
- `product.md`: how it works (restrictions → products → dishes), days, products per line, real prices, the budget, the AI rules.
- `architecture.md`: the tools, the RPC, `products.ts` and `offers.ts`, `menus.data` (budget, products), data flow.
- `development.md`: run the scraper before demos, `deno check`, `deploy chat`, where the usage logs are.
- `notes/price-sources-research.md`: correct the GDU weighable notes and the Ta-Ta notes.
- `notes/milestones.md`: tick milestone 5.
- `notes/open-decisions.md`: real prices are settled; legal is assumed for the hackathon; "most similar" is the agent's judgment.
- `notes/roadmap.md`: embeddings if search falls short, a cache of searches if cost or time rises, choosing brands one by one, the cart, macros from product labels.

## What changed while building it
- `main` had moved on: no confirm step and a list card in the chat ([ADR 0022](../adr/0022-list-follows-the-menu.md)). So prices reach the model through `save_menu` and the existing list tools (`show_shopping_list`, `update_shopping_list`), not a separate `get_prices` tool.
- Turns stop calling tools after 100 s instead of 110 s, to leave room for the reply.
- After the scraper's unit-of-sale run, a second migration ranks names that start with the query's first word first, then the closest names, and leaves out products with no size: ties by price had put juices before fresh bananas and ornaments before potatoes.

## Left out
The cart and zone availability, Devoto, embeddings, a search cache, asking for the budget (the teammate), share text with prices, promotions, a scheduled scraper, and the Supabase MCP in production.
