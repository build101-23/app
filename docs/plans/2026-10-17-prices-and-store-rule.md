# Prices (fake) and store rule

Status: **built**; release (step 7) is pending. Milestone 5 in [milestones](../notes/milestones.md). Based on `main` at `14b45b1`. It builds on [plan and menu](2026-10-17-plan-and-menu.md) and the [shopping list](2026-10-17-shopping-list.md). The choices marked *(team)* are listed at the end and need an OK before step 2.

> **⚠️ The prices in this milestone are made up, and they are temporary.** ADR 0019 says when they get deleted and lists every place to change. Everywhere else, a one-line pointer carries the literal `ADR 0019`. See [Removing the example prices](#removing-the-example-prices).

## Context
Milestone 4's list says what to buy, not where. Milestone 5 prices it at three stores with made-up prices, and puts the cheapest way to buy the list at the top of the List tab. It follows the store rule and the saving in [product.md §6](../product.md#6-save-money). The rule is one pure function with tests. CI runs lint, build and tests on Tenki runners ([ADR 0005](../adr/0005-cloudflare-workers.md) already gives the Tenki credits to CI).

A real price catalog is already on `main` ([ADR 0015](../adr/0015-price-scraper-python-job-with-time-budget.md), [ADR 0016](../adr/0016-price-catalog-one-row-per-product-per-chain.md)): `store_products`, one row per product per chain. The scraper is merged too ([ADR 0018](../adr/0018-gdu-listings-and-food-pages.md)), and `main` now defines milestone 5 as pricing the list from that catalog. But nothing maps a catalog food to a product yet. So this plan builds the store rule, the screen and CI on example prices bundled with the app, as decided with the team, and the matching step finishes milestone 5 ([removing the example prices](#removing-the-example-prices)).

The rule never imports prices: it takes them as an argument. Real prices later swap only the data source, while the rule, its tests and the screen stay.

The smallest version that meets the milestone:
- No table, no migration and no RLS change. The example prices are a TS constant, about 1 KB gzipped.
- One rule module, one seed module, the List tab block, one prompt sentence and one CI workflow.

## What milestone 4 gives
- **`supabase/functions/_shared/list.ts`:**
  - `buildList(menu)` returns one `Item { id, food, other_name, section, unit, amount, pack }` per id. The id is the catalog key, or `other:<unit>:<name>`.
  - `left(item, have)` is what's still to buy, not rounded up to steps. **This is what gets priced.**
  - `toBuy(item, have)` rounds up to whole packs or steps, for display.
- **`menus.have`**: item id → amount at home, or `null` for "enough" ([ADR 0017](../adr/0017-shopping-list-derived-in-the-browser.md)). Writing it doesn't touch `menus.updated_at`, which is the menu's version.
- **`catalog.ts`**: every food has a `section` and a `pack`, in the food's unit. `null` means it's sold loose or by weight.
- **`src/List.tsx`**: the list shows only once the menu is confirmed. `MenuRow` is at `:9`, and the `menus` select is at `:46`.

The rule's input comes straight from that:
```ts
const needs = items.map((i) => ({ id: i.id, amount: left(i, have) })).filter((n) => n.amount > 0)
```
- Crossed-out items have nothing left, so they aren't priced.
- A partly-had item is priced on what's left.

## Design
- **Store rule** in `supabase/functions/_shared/stores.ts`:
  - Plain TS, with no Deno or DOM globals.
  - It lives in `_shared` because that's where the `npm test` glob looks, and a test under `src/` fails `tsc` on `node:test`.
  - Only the web app imports it.
  ```ts
  export const stores = ['disco', 'geant', 'tata'] as const // = stores.key in the database; this order breaks every tie
  export type StoreKey = (typeof stores)[number]
  // base_qty: pack content in the food's catalog unit. by_weight: sold loose, price is per base_qty.
  // shortcut: one pack size per food and store; with real offers, take the cheapest size for the week (Later, ADR 0019)
  export type Offer = { price: number; base_qty: number; by_weight?: boolean }
  export type Prices = Partial<Record<string, Partial<Record<StoreKey, Offer>>>> // list item id -> store -> offer; absent = not sold there
  export type Need = { id: string; amount: number } // a list item id and what's left to buy
  // stores: in store order. at: item id -> store. saving: against the average, whole pesos, can be <= 0.
  export type Option = { stores: StoreKey[]; total: number; saving: number; at: Partial<Record<string, StoreKey>> }
  export type StorePlan = {
    perStore: { store: StoreKey; total: number; missing: number }[] // in store order
    notFound: string[]     // ids no store sells, every 'other' included, in list order
    single: Option | null  // the default
    split: Option | null   // two stores, when offered
  }
  export function cost(amount: number, offer: Offer): number
  export function planStores(needs: Need[], prices: Prices): StorePlan
  ```
  Exact semantics. `buildList` already gives one item per id, so the rule doesn't add anything up.
  1. **Item cost** (`cost`) is always rounded with `Math.round` to whole pesos.
     - Packed: `ceil(amount / base_qty − 1e-9) × price`. The epsilon keeps a float sum like 0.1 + 0.2 from adding a pack.
     - Loose: `amount × price / base_qty`, on the exact weight. The line rounds up to 100 g steps, the scale doesn't.
     - Each store is costed on the whole packs the week needs, and loose food by weight. The leftover in a pack is paid for, so a bigger pack wins only if it's cheaper even counting the leftover. For 1.2 kg of rice, a 5 kg bag at 249 loses to two 1 kg bags at 60 (T14), and a 5 kg bag at 100 wins (T17) *(team)*.
  2. **Priced items** are those that at least one store sells. Everything else goes to `notFound`: every `other`, and any catalog food no store sells. They are "not found online" and are left out of every total, every missing count and the average. "The whole list" in rule 1 means the priced items *(team)*.
  3. **Store rows.** `total` adds up the priced items the store sells. `missing` counts the priced items it doesn't sell, which is the "N productos no encontrados".
  4. **An option** is one store or two.
     - Each item goes to whichever store in the option sells it cheaper. A tie goes to the earlier store, and a store that doesn't sell an item isn't a candidate for it.
     - An option is valid only if it covers every priced item and each of its stores gets at least one. So a pair that buys everything at one store is not a split.
  5. **`single`** is the cheapest valid one-store option. A store missing an item is never `single`, even if it's cheaper.
  6. **The best pair** is the cheapest valid pair, and it may leave out the single store. Pairs are tried in the order (disco, geant), (disco, tata), (geant, tata). The first cheapest wins.
  7. **When the split is offered.**
     - With no `single`, `split` is the best pair.
     - With a `single`, the pair must save more than 0 and `10 × (single − pair) ≥ single`. That's whole-number math against the one-store total, so exactly 10% counts *(team)*.
     - One store stays the default.
  8. **No recommendation.** If neither one store nor any pair covers the list, both are `null` and only the store rows show. Three stores are never suggested. The seed can't hit this case, because every food is sold at two or more stores *(team)*.
  9. **Saving.**
     - `average` adds up, over the priced items, each item's mean cost across the stores that sell it.
     - An option's `saving` is `floor(average − total + 1e-6)`. Means like 31/3 aren't exact in floating point, and without the epsilon a peso can drop or depend on list order (T15).
     - Both options cover the same items, so they share one baseline *(team)*.
- **Example prices** in `supabase/functions/_shared/prices.ts`:
  ```ts
  // ⚠️ TEMPORARY, MADE-UP PRICES. Delete per ADR 0019 (checklist there).
  // shortcut: hardcoded example prices so the store rule and the List tab ship before catalog foods are matched to store_products.
  import { catalog, type CatalogKey } from './catalog.ts'
  import type { Offer, Prices, StoreKey } from './stores.ts'
  export const pricesDate = '2026-10-17T12:00:00-03:00' // Montevideo noon: a date-only string parses as UTC and shows the 16th
  // Price of the catalog's pack, or per kg, L or unit when the catalog says it's sold loose.
  const seed = {
    rice: { disco: 95, geant: 95, tata: 92 },
    egg: { disco: 150, geant: 145, tata: 160 },
    tomato: { disco: 89, geant: 85, tata: 105 },
    // ... one row per catalog food (54)
  } satisfies Record<CatalogKey, Partial<Record<StoreKey, number>>>
  export const examplePrices: Prices // each row's numbers become Offers, as below
  ```
  - With `satisfies`, the build fails if a catalog food has no row, the same way `t.foods` does.
  - `examplePrices` gives each number `base_qty = pack ?? (unit === 'un' ? 1 : 1000)` and `by_weight = pack === null && unit !== 'un'`.
    - Loose food in g or ml is priced per kg or L, on the exact weight.
    - Lettuce, the only loose food counted in units, is a 1-unit pack, so it's priced per whole head, as its line shows.
  - Every store sells the catalog's pack size, so a line's "2 × 1 kg" is true at every store. Different sizes per store come with real offers.
  - **How to write the rows** (realistic gaps, not tuned for demos) *(team)*:
    - Disco is the reference. It uses the spike's prices where we have them: rice, milk, butter, flour, polenta.
    - Géant matches Disco on about two thirds of foods, is $1–15 cheaper on most of the rest, and costs more on a few (oats).
    - Ta-Ta is cheaper on pantry goods and meat, and more expensive on dairy and produce.
    - Each store lacks one or two foods, and no food is missing at more than one store.
    - The missing foods are niche ones, so a shopper can't easily prove the example wrong. For example, Ta-Ta lacks `ricotta`, Géant lacks `tart_crust`, and Disco lacks `chard`.
- **List tab** (`src/List.tsx`):
  - Add `updated_at: string` to `MenuRow`, and `updated_at` to the `menus` select.
  - The plan is recomputed on every render, so a cross-out or a − updates the totals:
    ```ts
    const plan = planStores(needs, examplePrices)
    const priced = needs.length > plan.notFound.length
    ```
  - **The user's pick:**
    - `localStorage.storePick` holds the menu's `updated_at` when the user picked the split. Picking one store removes it, and any other value means one store. So a new menu starts on one store again, which is the default.
    - Every read and write is wrapped in `try`.
    - Comment: `// shortcut: the pick lives in this browser; move it next to menus.have if people switch devices`.
    - `const chosen = (pickedSplit && plan.split) || plan.single || plan.split`.
  - **Price block**, above the sections, shown when `priced`:
    - **The recommendation**, shown when `chosen` exists, under the heading "Dónde comprar". With two options it's a `role="radiogroup"` labelled by that heading.
      - **Both options:** two radio rows, "Todo en Disco · $ 1.937" and "Géant y Ta-Ta · $ 1.700 · $ 237 menos que todo en Disco".
      - **One option:** a single line. A split with no single store adds "Ningún súper tiene toda la lista."
      - The split row never says "ahorrás", so the only saving on screen is the one against the average.
    - **Saving:** "Ahorrás $ 24 frente al promedio de los súper", for the chosen option, shown only when `saving > 0`.
    - **Store rows:** "Disco $ 1.937", plus " · 2 productos no encontrados" when `missing > 0`.
    - **Label**, always in the block: "Precios de ejemplo del 17 de octubre, no son reales." The date is `new Date(pricesDate).toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })`.
  - **Line tags**, only when `priced`:
    - An item in `plan.notFound` gets "No encontrado online". Crossed-out items never reach the rule, so they get nothing.
    - With the split chosen, each priced line shows its store: `const store = chosen.at[item.id]`, then `t.stores[store]` when it's set.
  - **Money:** `new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format`, which prints `$ 1.234`.
  - The share and copy text stays as milestone 4 left it, so invented prices never leave the app *(team)*.
- **Strings** (`src/strings.ts`):
  - Add `import type { StoreKey } from '../supabase/functions/_shared/stores.ts'`.
  - `stores: { disco: 'Disco', geant: 'Géant', tata: 'Ta-Ta' } satisfies Record<StoreKey, string>`.
  - A `prices` block:
    - `where` (the legend), `oneStore(store, total)`, `split(a, b, total)`, `cheaperThan(amount, store)`, `noOneStore`;
    - `saving(amount)`, `missing(n)` (singular and plural), `notFound`;
    - `sample(date)`, with the comment `// temporary example-prices label (ADR 0019)`.
- **CSS** (`src/index.css`):
  - Add `input[type='radio']` to the `.list input[type='checkbox']` reset (`:378`), since the global `input` rule gives every input a full width and a border.
  - Radio rows are `<label>`s, so `.list label` (`:370`) already gives them 44 px.
- **Chat prompt** (`supabase/functions/chat/prompt.ts:7`):
  - Replace everything from "prices at each supermarket are coming soon" through "keep helping with the plan." with: "The List tab prices the list at Disco, Géant and Ta-Ta (example prices for now) and shows where it's cheapest. You can't see prices: if asked, point to the List tab and never quote or estimate one."
  - Above `SYSTEM_PROMPT`: `// "(example prices for now)" is temporary (ADR 0019).`
  - No tool and no `<saved_…>` block, and the prompt stays static *(team)*.
- **Learning table:** milestone 5 stores nothing. `StorePlan` already has what milestone 6 needs to log: both totals, the saving, and whether a split was offered next to one store. Milestone 6 logs the user's pick as an event.
- **CI:**
  - `.github/workflows/ci.yml`:
    ```yaml
    name: CI
    on:
      push:
        branches: [main]
      pull_request:
    permissions:
      contents: read
    jobs:
      check:
        # Public repo on self-hosted Tenki runners: fork PRs never run here (ADR 0020).
        if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository
        runs-on: tenki-standard-small-2c-4g
        timeout-minutes: 10
        steps:
          - uses: actions/checkout@v7
          - uses: actions/setup-node@v7
            with:
              node-version: 24 # Cloudflare Workers Builds' default, so CI builds like production
              cache: npm
          - run: npm ci
          - run: npm run lint
          - run: npm run build
          - run: npm test
    ```
  - `package.json`: `"lint": "oxlint --deny-warnings"`. Without the flag, oxlint exits 0 on warnings.
  - `tsconfig.node.json`: `"include": ["vite.config.ts", "supabase/functions/_shared"]`. Then `tsc -b` type-checks the test files (`menu.test.ts`, `list.test.ts` and the new ones), which Node otherwise only strips, and DOM globals are caught in `_shared`.
  - Facts the workflow relies on:
    - The repo is public.
    - The `v7` tags exist for both actions.
    - The build needs no secrets, because the `VITE_` values are in the committed `.env`.
    - Tests make no network calls.
    - Node 24 runs `.ts` tests through type stripping.
    - The 2c-4g size works on Tenki's free plan without a card.

## Removing the example prices
This is ADR 0019's text. The ADR holds it, and this section only previews it.
- **When:** the PR that matches catalog foods to `store_products` for Disco, Géant and Ta-Ta replaces `examplePrices` with the real loader, and deletes the example prices in that same PR. A scraper without that matching doesn't count as real prices.
- **Checklist:**
  1. Delete `supabase/functions/_shared/prices.ts` and `prices.test.ts`.
  2. In `src/List.tsx`, `examplePrices` and `pricesDate` become the real loader.
  3. In `src/strings.ts`, `t.prices.sample` becomes a "checked on" label.
  4. Drop "(example prices for now)" from `supabase/functions/chat/prompt.ts`, then run `npx supabase functions deploy chat`.
  5. Update `docs/product.md` §6, `docs/architecture.md` and `docs/notes/open-decisions.md`.
  6. Tick milestone 5's open sub-item in `docs/notes/milestones.md`.
- **Check:** `grep -rln "ADR 0019" src supabase docs` lists exactly these places, plus ADR 0019, the ADR index and this plan.
- **Deleting `prices.ts` breaks the build until `List.tsx` changes.** That's intended: a half-removal can't ship.

Left out:
- **Pricing:**
  - matching catalog foods to `store_products`;
  - different pack sizes per store, and choosing between them;
  - cheaper swaps (store brands, fruit and vegetables in season, another cut).
- **On screen:** per-item prices, and a checked date per store.
- **AI:** seeing prices.
- **Storage:** a prices table, a migration, and storing the pick on the server (milestone 6 logs it as an event).
- **CI extras:**
  - a required check or branch protection;
  - holding Cloudflare deploys until CI passes;
  - `deno check` of the function, and a `.node-version` file.

## Risks
- **Tenki on a public repo.**
  - GitHub runner groups serve only private repos by default, so jobs can sit "Queued" with no error. `timeout-minutes` doesn't count queue time.
  - Fix: turn on the runner group's "Allow public repositories".
  - Jobs are also rejected when the Tenki workspace has no credit.
  - Fallback: `runs-on: ubuntu-latest`, which is free for public repos. It's a one-line change, recorded in ADR 0020.
- **Fork PRs on self-hosted runners.** The `if:` guard skips them, and the org setting requires approval for outside collaborators.
- **Real chain names on made-up prices.** A screenshot could pass them off as real. The "de ejemplo" label is always inside the price block.
- **Splits will be rare.**
  - The spike's real price gaps were 0–17%, and a draft seed with realistic gaps saved 0–5.4%.
  - A split shows up mostly when the week needs a food that one store lacks. The 10% path is proven by tests, not by the demo.
  - So on these prices, "Do they accept a split?" gets almost no offers. That goes to `open-decisions.md`.
- **Pilot on example prices.** Milestone 6 has no real prices, so "Do they actually save?" would measure invented numbers. That goes to `open-decisions.md`.
- **Builds get stricter.** A type error in a `_shared` test now fails `npm run build`, which is also the Cloudflare build, so it blocks a deploy to `main`. CI doesn't block deploys either way.
- **Node 24 vs 26.** CI runs 24 and we run 26 locally. Both strip types by default. Not yet run on 24.

## Steps
1. Save this plan.
2. `supabase/functions/_shared/stores.ts` and `stores.test.ts`.
   - The tests use the real store keys (d, g, t below) and literal ids and prices, never the seed.
   - Unless noted, each item is a 1-unit pack, so its cost is its price.

   | # | Input | Expected |
   | --- | --- | --- |
   | T01 | `cost`: 700 g with a 1 kg pack at 200; 700 g with a 500 g pack at 120; 700 g loose at 230/kg; 600 g loose at 89/kg; 10 eggs with a 12-pack at 150; 1000 g with a 1 kg pack at 60 | 200; 240; 161; 53; 150; 60 |
   | T02 | `cost(0.1 + 0.2, { price: 10, base_qty: 0.3 })` | 10 (one pack) |
   | T03 | `[]`; only an `other` id | single and split null; `notFound` `[]`, then that id |
   | T04 | x, y: d 11/11, g 10/10, t 12/12 | single geant 20, `at` all geant, saving 2; store totals 22, 20, 24; split null |
   | T05 | x: d 50, g 40, t 60; y: d 50, g 60, t 60 | single disco 100; split disco+geant 90, x→geant, y→disco. With g's x at 41 (9%) or 45 (5%): split null |
   | T06 | x: d 10, t 9; y: d 10, g 12; z: g 10 | single null; split disco+geant 30; missing 1, 1, 2 |
   | T07 | x: d 80, g 30; y: d 20 | single disco 100; geant row `{ total: 30, missing: 1 }`; split disco+geant 50 |
   | T08 | x only at d 10, y only at g 20, z only at t 30 | single and split null; missing 2, 2, 2 (never three stores) |
   | T09 | x: d 10, g 11, t 12; then w, sold nowhere; then an `other` id | `notFound` `['w', that id]`; totals 10, 11, 12; missing 0, 0, 0; saving 1 |
   | T10 | all prices equal at 10; then x: d 10, g 20, t 20 and y: d 20, g 10, t 10 | single disco, split null; then split disco+geant |
   | T11 | x: d 10, g 20, t 30, y only at d 10; x: d 40, g 10, t 10, y only at d 10; x: d 10, g 11 | saving 10; single's saving −20, split 20 with saving 10; saving 0 (10.5 floored) |
   | T12 | x: d 0, g 0; y: d 0, t 0 | split null (a split that saves nothing isn't offered) |
   | T13 | x at d 10, plus two different `other` ids | single disco 10; `notFound` holds both ids, in list order |
   | T14 | rice 1200 g: d 5 kg bag at 249, g 1 kg at 60 | single geant 120; disco row 249 |
   | T15 | x: d 1, g 1, t 2; y: d 16, g 16, t 17; z: d 7, g 7, t 8; then the same list reversed | single disco 24, saving 1 both times |
   | T16 | x: d 10, g 10, t 5; y: d 20, g 20, t 30 | single disco 30; split disco+tata 25 (it ties geant+tata, which comes later), x→tata |
   | T17 | rice 1200 g: d 5 kg bag at 100, g 1 kg at 60 | single disco 100 (the leftover is paid for and it's still cheaper); split null |
   | T18 | `cost(700, { price: 49.9, base_qty: 500 })` | 100 |

3. `supabase/functions/_shared/prices.ts` with all 54 foods, and `prices.test.ts`:
   - S1: every price is a whole number above 1 (a lower one is a [placeholder](../notes/price-sources-research.md#data-rules)).
   - S2: `by_weight` appears only on foods measured in g or ml. Every food is sold at two or more stores, and every store lacks at least one food.
   - S3: a demo week with the three missing foods (ricotta, tart crust, chard) has no single store and does have a split.
4. `src/List.tsx` (`MenuRow`, the select, the price block, the pick, line tags), `src/strings.ts` (`stores`, `prices`) and `src/index.css` (radio reset, `.prices`).
5. `supabase/functions/chat/prompt.ts`: the sentence and its ADR 0019 comment.
6. CI: `.github/workflows/ci.yml`, the lint flag in `package.json`, and the `include` in `tsconfig.node.json`.
7. Release. There's no `db push`.
   1. Run `npm run lint`, `npm run build` and `npm test`.
   2. An owner of the `build101-23` org, once:
      - creates a Tenki workspace and installs its Runners app with access to `app`;
      - in Settings → Actions → Runner groups → Default, allows public repositories;
      - in Settings → Actions → General → Fork pull request workflows, requires approval for all outside collaborators.
   3. Open the PR and wait for CI to pass on `tenki-standard-small-2c-4g`. If it stays queued, recheck step 7.2. If that can't be fixed, switch to `ubuntu-latest` and record why in ADR 0020.
   4. Merge to `main`. Cloudflare deploys the List tab.
   5. `npx supabase functions deploy chat`, now that the prompt's prices are live.
   6. Try it on a phone:
      - a confirmed week shows the recommendation, the store rows and the "de ejemplo" label;
      - crossing out an item, or tapping −, lowers the totals;
      - a week with ricotta, tart crust and chard has no single store and recommends the split;
      - pick the split and reload: the pick stays and each line shows its store. A new menu goes back to one store;
      - an `other` item shows "No encontrado online";
      - lettuce is priced per whole head;
      - "¿cuánto me sale la semana?" in the chat points to the List tab.
   7. Database → Advisors → Security. No change expected.
8. Docs:
   - `docs/product.md` §6:
     - "Looks up every item on the list at the main supermarkets" becomes "Prices the list at Disco, Géant and Ta-Ta, with example prices for now ([ADR 0019](../adr/0019-example-prices-until-matched.md))".
     - "Compares price per kilo or liter…" becomes: each store is costed on the whole packs the week needs, and loose food on the exact weight (the line rounds up). So a bigger pack only wins if it's cheaper even counting the leftover.
     - Move "Suggests cheaper options the plan allows…" to `docs/notes/roadmap.md` under Money.
     - "Which store to buy at":
       - crossed-out items aren't priced, and partly-had items are priced on what's left;
       - "the whole list" means what at least one store sells;
       - the 10% is of the one-store total, which stays the default;
       - if neither one store nor two have the whole list, the app shows each store's total and recommends nothing.
     - "How much you saved": the average is per item, over the stores that sell it. The saving is rounded down and shown only when positive.
   - `docs/architecture.md` (re-read it first; `a2ef3a3` changed it):
     - Screens: List, with the store rule on top.
     - Shared code: the store rule (`stores.ts`), and the example prices (`prices.ts`), temporary per ADR 0019, used only by the web app.
     - Data flow: the List tab prices the list in the browser.
     - Stack: "Prices: example prices bundled with the app until catalog foods are matched ([ADR 0019](...)); real ones from supermarket websites and SIPC ([ADR 0003](...)), read by the scraper ([ADR 0015](...), [ADR 0016](...))". Add "CI: GitHub Actions on Tenki runners ([ADR 0020](...))".
   - `docs/development.md`:
     - Commands: lint fails on warnings.
     - Testing:
       - `npm run build` type-checks the `_shared` tests;
       - CI runs lint, build and tests on PRs and on pushes to `main`, on Tenki, and skips fork PRs (link the workflow);
       - CI uses Node 24, like Cloudflare, while your local Node may be newer;
       - CI doesn't block Cloudflare deploys.
   - `docs/notes/milestones.md`:
     - Under milestone 5, tick the sub-item for the rule, savings and CI on example prices, and link this plan.
     - Under milestone 5, add the open sub-item: "Price the list from the catalog: match catalog foods to `store_products`, then remove the example prices ([ADR 0019](...))".
   - `docs/notes/open-decisions.md`: "Real prices before the pilot? On example prices, 'Do they actually save?' and 'Do they accept a split?' measure nothing ([ADR 0019](...))". Add any *(team)* item that stays open.
   - **ADR 0019, "Example prices bundled with the app until real prices are matched"** (`0019-example-prices-until-matched.md`):
     - **Context:** `store_products` exists and the scraper fills it ([ADR 0016](...), [ADR 0018](...)), but nothing maps catalog foods to products yet. Options: a TS constant, or reading `store_products` with a matching table built now.
     - **Decision:**
       - Example prices in `_shared/prices.ts`: food → store → price for the catalog's pack, for Disco, Géant and Ta-Ta under their real names, labeled as examples, with one date.
       - Devoto is left out because its prices match Disco's.
       - The rule takes prices as an argument.
       - **When they're deleted, and the checklist:** the text of [Removing the example prices](#removing-the-example-prices).
     - **Consequences:**
       - No migration and no RLS change, and prices change only with a deploy.
       - Real offers need the food→product matching ([ADR 0003](...)). The loader builds the same `Prices` shape, and its filters and the date it shows are decided along with the matching.
   - **ADR 0020, "CI on Tenki runners":** self-hosted runners on a public repo, the fork guard and the approval setting, Node 24 in the workflow, advisory and not required, jobs rejected without Tenki credit, and `ubuntu-latest` as the one-line fallback.
   - Add both rows to `docs/adr/README.md`.
   - Set this plan's status to released.

## Decisions the team must confirm
1. **Where the "seeded" prices live.**
   - Decided with the team: a TS constant in `_shared/prices.ts`, deleted per ADR 0019.
   - Alternative: read `store_products` now, which needs the food→product matching first.
2. **Which stores, under which names.**
   - Decided with the team: Disco, Géant and Ta-Ta.
   - To confirm: their real names with the "de ejemplo" label, versus neutral "Súper A/B/C" until prices are real.
3. **Does the milestone 6 pilot run on example prices?**
   - Not decided here; it's logged in `open-decisions.md`.
   - Recommendation: do the matching before the pilot.
4. **"The whole list" in rule 1.**
   - Pick: what at least one store sells.
   - Alternative: every item. Then any `other` makes every store incomplete and forces a split.
5. **The 10% baseline.**
   - Pick: the one-store total, and exactly 10% counts.
   - Alternative: the average across stores, which makes splits easier to trigger.
6. **The average behind the saving.**
   - Pick: per item, the mean over the stores that sell it, added up and rounded down, and hidden when 0 or less.
   - Alternative: the mean of the store totals, which stores missing items pull down.
7. **No store and no pair has the whole list.**
   - Pick: no recommendation, only the store rows. The seed never hits this case.
   - Alternative: the pair with the fewest gaps, with the rest tagged "No está en X ni en Y".
8. **Big packs.**
   - Pick: each store is costed on the whole packs the week needs, and the leftover is paid for. One pack size per food, the catalog's, as a shortcut.
   - Alternative: several sizes per store now.
9. **Example price gaps.**
   - Pick: realistic gaps, with niche missing foods. Splits show up through missing foods, and tests prove the 10% path.
   - Alternative: exaggerated gaps, so a 10% split shows in demos. That would skew any reading of whether people accept a split.
10. **Share text.**
    - Pick: unchanged while prices are examples.
    - Alternative: add each item's store when a split is chosen.
11. **AI.**
    - Pick: one prompt sentence that sends price questions to the List tab. It needs a function deploy.
    - Alternative: no prompt change, with the risk that the AI invents prices that contradict the screen.
12. **CI runner.**
    - Pick: Tenki, as the milestone asks. It needs an org owner's setup, skips fork PRs, and is advisory.
    - Alternative: the free `ubuntu-latest`, with no setup and no self-hosted risk on a public repo.
