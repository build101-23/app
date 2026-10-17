# 0019. Example prices bundled with the app until real prices are matched

- Status: Accepted
- Date: 2026-10-17

## Context
Milestone 5 prices the shopping list at three stores and picks where to buy it ([plan](../plans/2026-10-17-prices-and-store-rule.md)). The price catalog exists ([ADR 0016](0016-price-catalog-one-row-per-product-per-chain.md)), and the scraper fills it ([ADR 0018](0018-gdu-listings-and-food-pages.md)), but `store_products` has one row per product per chain, and nothing maps a catalog food to those products yet.

Options considered:
- Read `store_products` now, which first needs the food→product matching ([ADR 0003](0003-price-sources.md)) and what counts as "most similar" ([open decisions](../notes/open-decisions.md)).
- Ship the store rule and the screen on example prices, kept apart from the real catalog.

## Decision
- **Example prices**, made up, in `supabase/functions/_shared/prices.ts`. Each food has a price for the catalog's pack (or per kg, liter or head when it's sold loose) at Disco, Géant and Ta-Ta, under their real names, with one date. The screen always says "Precios de ejemplo… no son reales".
- Devoto is left out: its prices nearly always match Disco's ([feasibility](../notes/price-scraping-feasibility.md#gdu-prices-are-not-identical)).
- The store rule (`_shared/stores.ts`) never imports prices. It takes them as an argument, keyed by list item id.
- **They are temporary.** The PR that matches catalog foods to `store_products` for Disco, Géant and Ta-Ta replaces `examplePrices` with the real loader and deletes the example prices in that same PR. A scraper without that matching doesn't count as real prices.
- **Removal checklist**, for that PR:
  1. Delete `supabase/functions/_shared/prices.ts` and `prices.test.ts`.
  2. In `src/List.tsx`, `examplePrices` and `pricesDate` become the real loader.
  3. In `src/strings.ts`, `t.prices.sample` becomes a "checked on" label.
  4. Drop "(example prices for now)" from `supabase/functions/chat/prompt.ts`, then `npx supabase functions deploy chat`.
  5. Update `docs/product.md` §6, `docs/architecture.md` and `docs/notes/open-decisions.md`.
  6. Tick milestone 5's open sub-item in `docs/notes/milestones.md`.

  `grep -rln "ADR 0019" src supabase docs` lists every place. Deleting `prices.ts` breaks the build until `List.tsx` changes, on purpose: a half-removal can't ship.

## Consequences
- No migration and no RLS change. The prices add about 1 KB to the bundle and change only with a deploy.
- The rule, its tests and the screen stay when the prices go.
- Real offers need the food→product matching. The loader builds the same `Prices` shape, and its filters and the date it shows are decided along with the matching.
- Until then, the money questions in [product.md](../product.md#what-we-want-to-learn) can't be answered: savings on example prices aren't savings.
