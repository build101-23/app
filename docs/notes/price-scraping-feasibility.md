# Price scraping feasibility

Results of the supermarket price spike, run on 2026-10-17 ([plan](../plans/2026-10-17-price-scraping-spike.md), [research](price-sources-research.md), rules in [ADR 0008](../adr/0008-how-we-read-supermarket-sites.md)). Code in `spikes/supermarket-prices/`.

## Verdict

**Yes, we can read prices from Devoto, Géant, Disco and Ta-Ta.** One run of the 15-item test basket brought 504 priced products in 4 minutes, with no blocks and no errors. The hard part is not fetching but **matching**: only 10 products were found as the exact same product at Ta-Ta and at the GDU chains, mostly because each chain was searched differently.

## Run

Full basket, all four chains, 1 request per second.

| | Devoto | Géant | Disco | Ta-Ta |
| --- | --- | --- | --- | --- |
| Requests | 70 | 70 | 70 | 15 |
| Priced products | 66 | 68 | 67 | 303 |
| Not found (404) | 4 | 2 | 3 | — |
| Blocked | No | No | No | No |

- 225 requests in 234 s (plus 3 to download the GDU sitemap the day's first run; cached 24 h).
- 1.6 s of CPU for the whole run. The GDU sitemap is 10.5 MB with 68,683 products, and extracting its URLs took 15 ms of CPU. A product page parses in about 1 ms.
- Ta-Ta is much cheaper to read: one GraphQL request returns 24 products with prices. GDU needs one request per product.

## What the data looks like

- **Prices.** For GDU, the JSON-LD price always equals the visible price (201 of 201), and only 1 product showed a previous ("before") price. So the JSON-LD price is the current selling price, promotions included. Ta-Ta gives `price` and `listPrice`; 53 of 303 products had a higher list price.
- **Placeholder prices.** 7 GDU products had a price of $0 or $1 (for example Harina 0000 Primor at Devoto, $0, while Géant shows $53). The spike drops any price of $1 or less and keeps the raw value in `notes`.
- **EAN.** 48 of 201 GDU products have no GTIN in the JSON-LD, apparently the newer ones. Devoto, Géant and Disco share SKU ids, so they still match by SKU (`exact_sku`). Ta-Ta never has an EAN.
- **Size.** Read for 494 of 504 products, from the spec ("Contenido") at GDU and from the name at Ta-Ta. The 10 unknown ones are names like "1K+100G Gratis" or "50 sticks", left empty on purpose.
- **Text.** Two Ta-Ta names come with broken accents from the source (for example "CaÃ±uelas"). They're kept as they come.

## GDU prices are not identical

The handoff guessed that Devoto, Géant and Disco would have almost the same prices. In 65 products found at two or more of them, **23 (35%) had different prices**. In 21 of those 23, Devoto and Disco match each other and Géant differs: cheaper in 17 (usually by $1–$15), more expensive in 4 (Avena laminada Río de la Plata 200 g: $25 at Devoto and Disco, $38 at Géant). Comparing the three is worth it, but less than comparing against Ta-Ta.

## Matching

| Level | Matches |
| --- | --- |
| `exact_gtin` | 145 store offers |
| `exact_sku` | 47 store offers |
| `exact` (Ta-Ta ↔ GDU by brand, size and name) | 10 products |
| `review` | 10 pairs |
| `substitute` (provisional rule) | 287 |

The 10 exact Ta-Ta ↔ GDU products, with prices in UYU:

| Product | Devoto | Géant | Disco | Ta-Ta |
| --- | --- | --- | --- | --- |
| Arroz Parboiled Saman 500 g | 49 | 49 | 49 | **48** |
| Arroz Blanco Saman 5 kg | **249** | **249** | **249** | 299 |
| Leche Ultra Conaprole Deslactosada Descremada 1 L | **69** | **69** | **69** | 80 |
| Aceite de Canola Óptimo 900 ml | 104 | 104 | 104 | **97** |
| Yerba Canarias Suave 1 kg | 194 | 194 | 194 | 194 |
| Polenta 1 Minuto Puritas 450 g | **48** | **48** | **48** | 49 |
| Manteca Conaprole 500 g | 281 | **275** | 281 | 315 |
| Manteca Salada Conaprole 100 g | 65 | **64** | 65 | 65 |
| Harina 0000 Primor 1 kg | — | 53 | 53 | **50** |
| Huevo de chocolate Zaini Paw Patrol 20 g | **104** | **104** | **104** | 109 |

No chain is always cheapest, which is the case for the product.

Why there are so few exact Ta-Ta matches:
1. **Different discovery.** GDU candidates come from the sitemap (newest ids per basket item), while Ta-Ta comes from its search (most relevant). They pick different products. Of 303 Ta-Ta products, only 37 had a GDU product with the same brand and size at all.
2. **Different names for the same thing.** "UHT" vs "ultra", "lomito" vs "lomitos", "Yerba Mate" vs "Yerba". A small synonym table already raised matches from 7 to 10, and the 10 `review` pairs are mostly real matches that need a better name rule.

Substitutes are useful but not safe yet. Most are reasonable (Aceite de maíz Arcor 900 ml → Aceite de Maíz Delicia 1.5 L, compared per liter), but the rule still allows some mistakes, such as semi-skimmed yogurt for skimmed (Yogur Claldy Descremado → Yogur Semidescremado Colonial). What counts as "most similar" is still [open](open-decisions.md).

## Problems found in the basket

- The GDU "huevos" filter (`huevos?-`, no brand list) picked Easter and chocolate eggs instead of real eggs. Discovery by URL slug is noisy.
- "Arroz integral para perros" (dog food) came up under rice.
- Ta-Ta's search returned "Coca-Cola Zero Azúcar" for "azúcar". It's now filtered by requiring the product type at the start of the name (57 results dropped across the basket).

## What this means for the app

- **Start from the list item and search every chain the same way.** For the app, we need "find 1 kg white rice at each store", not a catalog dump. Ta-Ta's search does that already. For GDU, the next thing to try is their search (or a local index of the sitemap), so both chains are searched with the same terms.
- **Keep a product catalog of our own.** Matches should be saved once (by EAN or SKU where possible, reviewed by hand for the rest) and reused every week, not recomputed on each run.
- **Prices are for one default branch per chain** (Devoto Portones, Géant Parque Roosevelt, Disco Plaza Italia, Ta-Ta sales channel 4), not for the user's address.
- **Where it runs.** A full read is minutes of wall clock but only seconds of CPU. It's too long for one Edge Function call (150 s on the free plan) but fits in batches, or in a scheduled job outside Supabase. See [where scraping should run](price-sources-research.md#where-scraping-should-run).
- **The data shape works for the database.** The offer fields in the [research note](price-sources-research.md#proposed-offer-fields) were enough for every comparison here, and can shape the fake prices of milestone 5 ([milestones](milestones.md)).
