# 0023. Scraper prices for the unit of sale

- Status: Accepted
- Date: 2026-10-17

## Context
The chat agent will price menus from `store_products` in whole units of sale: what you add to the cart ([plan](../plans/2026-10-17-scraper-unit-of-sale.md)). It needs to know what each price is for, and what one unit of sale holds. Some rows got that wrong, so their `unit_price` was 0.5x to 10x off ([research](../notes/price-sources-research.md)):
- **GDU items sold by weight** show "$ X / kg", then the piece's price. We stored X with the name's weight as the amount: "Carne Picada x 250 g" at $329 per kg came out at $1,316 per kg.
- **GDU pieces** like "Nalga de ternera un. x 750 g" show only the piece's price ($532) on the product page, while its JSON-LD has the price per kg ($709). We stored the JSON-LD price with the name's weight.
- **Ta-Ta pieces over 1 kg** (`measurementUnit` kg, `unitMultiplier` over 1) are priced per kg. We stored the price as if it were for the whole piece.
- The size merge rule ([ADR 0016](0016-price-catalog-one-row-per-product-per-chain.md)) never let a size read from the unit replace one read from the spec.
- The GDU food phase ([ADR 0018](0018-gdu-listings-and-food-pages.md)) took the newest ids per food. Those are mostly packaged goods: every newest "tomate-" id was canned. It also skipped every saved product, so the wrong rows it saved would never be read again.

## Decision
- **The contract for rows with `size_source = 'unit'`:** the price is for `base_qty` `base_unit`, and one unit of sale is `size_qty` `size_unit`, with `pack_count` 1. Rows priced per kg have `base_qty` 1000 g and the unit of sale in g or kg.
- **GDU, sold by weight:** the price block has the `product-price-weighable` class and a "/ kg" price, on cards and on product pages.
  - The price is per kg, and so is the "before" price, taken only from the block per kg.
  - The unit of sale is the name's weight (on a product page, else the spec's) when the piece's price agrees with it: the site charges the price per kg times the weight, rounded up. Otherwise it's the piece's price over the price per kg, with a note. Without a piece price either, it's 1 kg, with a note.
  - When only one of the two signs is there, a note and no size, so no unit price.
- **GDU product pages:** when the visible price and the JSON-LD price differ by more than $1, the visible one is stored. It's what the cart charges, and the name's weight is then the pack. The note stays. A page with no visible price keeps the JSON-LD one, with a note.
- **Ta-Ta:** in kg with `unitMultiplier` over 1, the price is per kg and the unit of sale is `unitMultiplier` kg, with a note when the name's weight differs. Up to 1 kg, the price is for `unitMultiplier` kg, as before. Names and brands mis-encoded as Latin-1 or Windows-1252 ("VacÃ­o") are repaired, each broken run on its own.
- **Size merge rule** (in `upsert_store_products`), replacing ADR 0016's:
  - a size read from the unit replaces any saved size, and any later read replaces it;
  - a size read from the spec isn't replaced by one from the name, or by none.
- **GDU food phase,** changing ADR 0018's picks:
  - Fresh produce and meat sold by weight come first: slugs with `aprox`, `x-kg`, `malla` or `bandeja`. Then newest first.
  - It skips what the listings read, in this run or before, instead of everything saved. Products found only through food pages are read again: never-read ones first, then the oldest, so a run cut short by its budget leaves the rest for the next one.

## Consequences
- `unit_price` is right for items sold by weight and for pieces, and the agent can price whole units of sale.
- The food phase keeps the same products current instead of adding new ones each run: still at most 10 per food. Rows saved by earlier food phases that no longer make a food's top 10 keep their old values until they do.
- `bandeja` also marks some ready meals ("pollo spiedo en bandeja") and seafood, which then take some of a food's 10 places.
- Rows saved from listings before this change are fixed only when a listing reads them again.
- If GDU changes its price markup and only one sign is left, items sold by weight get a note and no size. If both signs go, they are read as flat prices again, as before this change. A product page whose price block is gone at least gets a note.
- A pushed migration not yet on `main` makes `db push` fail on other branches until they have the file.
