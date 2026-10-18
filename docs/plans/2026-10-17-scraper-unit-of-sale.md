# Scraper prices for the unit of sale

Status: **done** ([ADR 0023](../adr/0023-scraper-prices-for-the-unit-of-sale.md)).

## Context
The chat agent will price menus in whole units of sale from `store_products`. It relies on one contract for rows with `size_source = 'unit'`: `base_qty`/`base_unit` is the amount the price is for, and `size_qty`/`size_unit` is one unit of sale (what goes in the cart). Today some rows break it, so their `unit_price` is 0.5x to 10x off:
- **GDU weighable items** show "$ X / kg" then "$ Y" for the piece. We store X as the price and the name's weight as `base_qty`.
- **GDU per-piece items** on product pages: the JSON-LD price is per kg, the visible one is for the piece. We store the JSON-LD one with the name's weight.
- **Ta-Ta items over 1 kg** (`measurementUnit` kg, `unitMultiplier` > 1): the price is per kg, but we store it as the price of `unitMultiplier` kg.
- `upsert_store_products` never lets a `unit` size replace a `spec` one.

Also, the GDU food phase takes the newest ids per food, which are mostly packaged goods (all newest "tomate-" ids are canned), and some Ta-Ta names are mis-encoded ("VacÃ­o").

## Design
- **GDU weighable** (card `desc-prices`, product page `det-precios`): the `product-price-weighable` class and a "/ kg" price. Then `price` is per kg, `base_qty` 1000 g, `size_source` 'unit', and the unit of sale is the name's weight (product pages: else the spec's). After review: only when the piece price agrees with it, else piece ÷ price per kg, else 1 kg. A note when only one of the two signs is there.
- **GDU product pages:** when the visible price differs from JSON-LD by more than $1, store the visible one (the piece, priced with the name's weight). Keep the note.
- **GDU food phase:** slugs that look like fresh produce (`aprox`, `x-kg`, `malla`, `bandeja`) come first, then newest first. It skips only what the listings read, so its own earlier pages (some saved wrong) are read again, never-read and oldest first.
- **Ta-Ta:** kg with `unitMultiplier` > 1 is priced per kg: `base_qty` 1000 g, unit of sale `unitMultiplier` kg, no "priced for" note. Names with "Ã" get a latin-1 → utf-8 round trip.
- **Merge rule** (new migration, same function body): a `spec` size is kept only against a `name` or empty one; a `unit` size always replaces and can always be replaced.

## Steps
1. Save this plan.
2. `scraper/gdu.py`, `scraper/tata.py`, `scraper/sizes.py` if a helper belongs there.
3. Tests in `scraper/tests/` with hand-written fixtures; run the scraper tests.
4. Migration `supabase/migrations/<timestamp>_unit_of_sale.sql`; `npx supabase db push`.
5. Run `python -m scraper --stores disco,geant,tata`; check 301223 at Disco and Géant, 401026, Ta-Ta 13220 and mis-encoded names left.
6. Docs: ADR 0023, ADR 0016 status and `docs/adr/README.md`, `docs/notes/price-sources-research.md`, the merge rule in `docs/architecture.md` if it states it.
7. Commit, push, PR to `main`.
