# 0003. Prices from supermarket websites and SIPC

- Status: Accepted
- Date: 2026-10-17

## Context
Saving money is half of the product, so every item on a list needs a current price at each big supermarket in Montevideo. Options considered:
- Reading the supermarkets' online stores: full catalog and current prices, but we have to match list items to products ourselves and keep prices fresh.
- The government's price system ([SIPC](https://www.gub.uy/ministerio-economia-finanzas/sites/ministerio-economia-finanzas/files/documentos/noticias/mensual_junio_2025-1.pdf)): official and free, but it only covers a few hundred basic products.
- A deal with Cabacua: products already matched, but it depends on a partner.

## Decision
Use the supermarkets' websites as the main source, and SIPC for the basic products it covers, to fill gaps and to check our prices against. A deal with Cabacua stays the fallback.

## Consequences
- We own product matching: turning "1 kg chicken breast" into the right product at each store. This is the hardest part of the save-money feature.
- Each site's terms must allow it ([open decision](../notes/open-decisions.md)).
- Sites change, so reading them needs monitoring, and every price shows the date it was checked.
