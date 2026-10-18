// A store's cart from the priced list (docs/plans/2026-10-18-fill-cart.md): which products, how many units of sale,
// and which list items stay out and why. Plain TS shared like offers.ts, so no Deno or DOM globals here.
import { lineOf, type Pricing } from './offers.ts'
import type { StoreKey } from './stores.ts'

// One product to add: units of sale of a sku, and what they cost at our prices.
export type CartLine = { sku: string; qty: number; name: string; url?: string; cost: number }
// A list item left out: the store doesn't sell it, it's sold by weight where the cart can't take that yet, or no store
// sells it.
export type Skipped = { id: string; reason: 'not_here' | 'weighed' | 'not_found' }
export type Cart = { store: StoreKey; lines: CartLine[]; skipped: Skipped[]; total: number }

// Whether a store's cart takes food sold by weight. Ta-Ta adds one unit of sale per qty, at our price (tested on
// 2026-10-18, docs/notes/cart-handoff-feasibility.md). Disco and Géant wait for their own test.
export const weighedInCart: Record<StoreKey, boolean> = { disco: false, geant: false, tata: true }

// The cart at store for the list items in ids, in list order, on what's left to buy (crossed-out items have no need).
// Items that picked the same product become one line with both quantities, since Ta-Ta keeps only the larger
// quantity of a sku repeated in one link.
export function cartFor(p: Pricing, store: StoreKey, ids: Iterable<string>): Cart {
  const wanted = new Set(ids)
  const lines = new Map<string, CartLine>()
  const skipped: Skipped[] = []
  for (const need of p.needs) {
    if (!wanted.has(need.id)) continue
    const offer = p.prices[need.id]?.[store]
    if (!offer?.sku) {
      skipped.push({ id: need.id, reason: p.plan.notFound.includes(need.id) ? 'not_found' : 'not_here' })
    } else if (offer.weighed && !weighedInCart[store]) {
      skipped.push({ id: need.id, reason: 'weighed' })
    } else {
      const { packs, cost } = lineOf(need, offer)
      const line = lines.get(offer.sku)
      if (line) {
        line.qty += packs
        line.cost += cost
      } else {
        lines.set(offer.sku, { sku: offer.sku, qty: packs, name: offer.name ?? '', url: offer.url, cost })
      }
    }
  }
  const all = [...lines.values()]
  return { store, lines: all, skipped, total: all.reduce((sum, line) => sum + line.cost, 0) }
}

// Ta-Ta's VTEX add-to-cart link. Opened in the user's browser, it adds each sku to their own cart, or raises it to qty
// when the cart has fewer, and never lowers or removes anything (docs/notes/cart-handoff-feasibility.md). The checkout
// lives on secure., not on the storefront in stores.base_url. Sales channel 4 is the one the price scraper reads
// (scraper/tata.py); seller 1 took every item in the spike and in the tests (docs/notes/cart-handoff-feasibility.md).
export const tataCartUrl = (lines: CartLine[]) =>
  `https://secure.tata.com.uy/checkout/cart/add?${lines
    .map((line) => `sku=${encodeURIComponent(line.sku)}&qty=${line.qty}&seller=1`)
    .join('&')}&sc=4`
