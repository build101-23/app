// The store rule and the saving (docs/product.md, "Which store to buy at" and "How much you saved").
// Plain TS shared by the web app and the chat function, so no Deno or DOM globals here. Prices come in as an argument:
// offers.ts builds them from the products the chat agent picked (ADR 0024).
export const stores = ['disco', 'geant', 'tata'] as const // = stores.key in the database; this order breaks every tie
export type StoreKey = (typeof stores)[number]

// base_qty: pack content in the food's catalog unit. by_weight: sold loose, price is per base_qty.
// sku, name, url: the product behind the offer, for the screen; the rule ignores them.
export type Offer = { price: number; base_qty: number; by_weight?: boolean; sku?: string; name?: string; url?: string }
// List item id -> store -> offer. A missing store means it doesn't sell that item.
export type Prices = Partial<Record<string, Partial<Record<StoreKey, Offer>>>>
// A list item id and what's left to buy of it (list.ts left()).
export type Need = { id: string; amount: number }
// stores: in store order. at: item id -> store. saving: against the average, whole pesos, can be <= 0.
export type Option = { stores: StoreKey[]; total: number; saving: number; at: Partial<Record<string, StoreKey>> }
export type StorePlan = {
  perStore: { store: StoreKey; total: number; missing: number }[] // in store order
  notFound: string[] // ids no store sells, every 'other' included, in list order
  single: Option | null // the default
  split: Option | null // two stores, when offered
}

// Whole pesos. Packs are bought whole, so the leftover is paid for; loose food is priced on the exact weight.
export const cost = (amount: number, offer: Offer) =>
  Math.round(
    offer.by_weight
      ? (amount * offer.price) / offer.base_qty
      : Math.ceil(amount / offer.base_qty - 1e-9) * offer.price, // epsilon: a float sum like 0.1 + 0.2 must not add a pack
  )

export function planStores(needs: Need[], prices: Prices): StorePlan {
  const at = (store: StoreKey, need: Need) => {
    const offer = prices[need.id]?.[store]
    return offer ? cost(need.amount, offer) : Infinity
  }
  const priced = needs.filter((need) => stores.some((store) => at(store, need) < Infinity))
  const notFound = needs.filter((need) => !priced.includes(need)).map((need) => need.id)
  // Each item's mean cost over the stores that sell it, added up.
  const average = priced.reduce((sum, need) => {
    const costs = stores.map((store) => at(store, need)).filter((c) => c < Infinity)
    return sum + costs.reduce((a, b) => a + b) / costs.length
  }, 0)

  // Each item at the cheaper store of these (the earlier one on a tie). Valid only if it covers every
  // priced item and every store gets something, so a pair that buys everything at one store is no split.
  const option = (these: StoreKey[]): Option | null => {
    const where: Option['at'] = {}
    let total = 0
    for (const need of priced) {
      const store = these.reduce((a, b) => (at(b, need) < at(a, need) ? b : a))
      if (at(store, need) === Infinity) return null
      where[need.id] = store
      total += at(store, need)
    }
    if (new Set(Object.values(where)).size < these.length) return null
    // The epsilon: means like 31/3 aren't exact, and the floor would drop a peso.
    return { stores: these, total, saving: Math.floor(average - total + 1e-6), at: where }
  }
  // The first of the cheapest wins, so ties follow store order.
  const cheapest = (options: (Option | null)[]) =>
    options.reduce<Option | null>((best, o) => (o && (!best || o.total < best.total) ? o : best), null)

  const single = cheapest(stores.map((store) => option([store])))
  // Pairs in order: (disco, geant), (disco, tata), (geant, tata). Never three stores.
  const pair = cheapest(stores.flatMap((a, i) => stores.slice(i + 1).map((b) => option([a, b]))))
  const saves = single && pair ? single.total - pair.total : 0
  return {
    perStore: stores.map((store) => {
      const sold = priced.filter((need) => at(store, need) < Infinity)
      return { store, total: sold.reduce((sum, need) => sum + at(store, need), 0), missing: priced.length - sold.length }
    }),
    notFound,
    single,
    // Offered when no single store has everything, or when it saves at least 10% of the one-store total.
    split: pair && (!single || (saves > 0 && 10 * saves >= single.total)) ? pair : null,
  }
}
