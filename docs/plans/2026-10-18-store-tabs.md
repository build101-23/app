# The List shows one supermarket at a time, with an order button at the bottom

Status: **done** in code (2026-10-18); the `chat` deploy (prompt line) goes with the merge. Branch `feat/store-tabs`, cut from `main` at `6165d26` (with build101-23/app#19 and #21). Its ADR is 0034 (main took 0031 to 0033 meanwhile).

## Context
- Today the List tab opens with a "Dónde comprar" card:
  - the store rule's recommendation, a split to pick, and the totals per store;
  - the store logos (#21) and the cart buttons (#19, [ADR 0030](../adr/0030-cart-filling-tata-link-gdu-team-extension.md)).
- Each line shows its product at the store the chosen option buys it in.
- What the user asked for (2026-10-18), in place of that card:
  - **three icons on top of the list**, PNG if possible, one per supermarket. Tapping one shows the same list with that supermarket's products and prices.
  - **under the list, a button** ("Pedir ahora") that fills the cart at that supermarket. Only Ta-Ta works for now.

## Decisions (made in chat, 2026-10-18)
- **The tabs replace the "Dónde comprar" card.**
  - Three tabs on top of the list, each with:
    - the chain's PNG icon;
    - its name;
    - its total for what's left to buy, with "faltan N" when items are missing there.
  - The list opens on the store the rule recommends, marked "Más barato". With no store that has the whole list, it opens on the one missing the fewest items, then the cheapest.
  - Under the tabs, for the selected store: what it comes to per day, the budget line, the saving (only when it's the recommended store) and the date the prices were read.
  - The two-store split is no longer offered in the List. The store rule and the chat's card don't change.
- **A product the selected store doesn't have stays on the list**, tagged "No está en {store}", and isn't counted in that store's total. "No encontrado online" stays for items no store sells.
- **The order button goes under the list:** "Pedir ahora en {store}", with the store's icon.
  - Ta-Ta: the add-to-cart link from #19 (`cartFor` over every line left to buy). Under it: how many products, the estimated total without delivery, and what stays out.
  - Disco and Géant: the same button, disabled, with the design system's "Muy pronto" pill and one muted line saying to add the products from each one's link.
- **Icons:** each chain's own square PNG icon, from its website, scaled down to 128px and otherwise unchanged.

  | Chain | Source | Notes |
  | --- | --- | --- |
  | Disco | `https://www.disco.com.uy/img/Disco/icon.png` | 512px, the red oval |
  | Géant | `https://www.geant.com.uy/img/Geant/icon.png` | 512px, "Gé" in green |
  | Ta-Ta | `https://www.tata.com.uy/icons/icon-512x512.png` | the red wordmark |

  They replace the SVG logos from #21 (`StoreLogo`), which only lived in the card.

## Steps
1. Save this plan.
2. **Icons:** `src/assets/stores/{disco,geant,tata}.png` at 128px, replacing the SVGs. `StoreLogo` becomes `StoreIcon` (a square on a white tile, the same in both themes).
3. **Tabs:** in `src/List.tsx`, replace the card with `StoreTabs`.
   - Buttons with `aria-pressed`, inside a labelled group.
   - The selection is kept per menu version in `localStorage` (`storeTab`), like the old `storePick`, which goes away.
   - `budgetText` drops the split hint.
   - Each line shows its product at the selected store, or "No está en {store}".
4. **Order button:** `src/Cart.tsx` becomes the block under the list.
   - `optionCarts` and the "Armar todo en Ta-Ta" alternative go away.
   - The strings in `t.cart` change to match.
   - `cart.test.ts` drops the `optionCarts` case.
5. **Check:**
   - `npm test`, lint and build.
   - The fixture (`cart=tata`, the default, `prices=stale`) at 360, 390 and 1280px, light and dark.
   - Tap each tab: totals, tags, links, and the button enabled or disabled.
6. **Docs step:**
   - ADR 0034: the List shows one store at a time, without the split; it partly changes the store rule's presentation in `product.md`.
   - `docs/product.md` §5 and §6, `docs/design.md` (List, Store icons), `docs/architecture.md` (List screen), `docs/adr/README.md`.
7. Commit, push and open the PR after the user's OK.
