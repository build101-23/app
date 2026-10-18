# To do

Small fixes noticed in review and left for later. Remove each one when it's fixed.

## From the review of build101-23/app#13 (real products)
- [ ] **A list with everything crossed out reads as "not priced" to the chat model.**
  - With nothing left to buy, `pricing()` in `supabase/functions/_shared/offers.ts` returns `status: 'none'`, and `verdict()` tells the model to search again.
  - The screens hide this case already; only the model sees the wrong line.
  - Fix: no needs means a "nothing left to buy" verdict. Add a test.
- [ ] **A price read that fails stays failed.**
  - `usePrices` in `src/prices.ts` re-reads only when the menu's skus change or the List tab remounts, so a network error keeps "No se pudieron cargar los precios." on screen.
  - Fix: retry on `visibilitychange` (as the menu load does) or after a short delay.
- [ ] **An infinite amount or budget passes the menu checks.**
  - `!(x > 0)` lets `Infinity` through (JSON `1e999`) in `menuProblems` (`supabase/functions/_shared/menu.ts`).
  - Fix: check with `Number.isFinite`.
- [ ] Minor:
  - `search_products` silently drops queries past 20; say so in the result.
  - Scraped product names reach the model as is; consider stripping anything that isn't a plain name.

The review's critical finding, that `starts_with` is unqualified under an empty `search_path`, doesn't apply: `starts_with` is built into Postgres (`pg_catalog`), and the deployed search runs.
