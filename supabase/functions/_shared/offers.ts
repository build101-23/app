// Prices the shopping list from the products the chat agent picked (ADR 0024), in whole units of sale, runs the store
// rule and checks the total against the menu's budget. Plain TS shared by the List tab, the chat's list card and the
// chat function, so the screen and the model always see the same numbers. No Deno or DOM globals here.
import { buildList, left, type Have, type Item } from './list.ts'
import type { MenuData } from './menu.ts'
import { offerOf, picksByItem, rowKey, type ProductRow } from './products.ts'
import { cost, planStores, stores, type Need, type Offer, type Option, type Prices, type StorePlan } from './stores.ts'

// What's left to buy, the only pricing input. A forged have can make left() NaN: that item counts as nothing at home.
export function needsFor(items: Item[], have: Have): Need[] {
  return items.flatMap((item) => {
    const amount = left(item, have)
    const safe = Number.isFinite(amount) ? amount : item.amount
    return safe > 0 ? [{ id: item.id, amount: safe }] : []
  })
}

// Each list item at each store where the model picked a product that can be priced in the item's unit.
export function pricesFor(items: Item[], menu: MenuData, rows: ProductRow[]): Prices {
  const byKey = new Map(rows.map((row) => [rowKey(row.store_key, row.store_sku), row]))
  const picks = picksByItem(menu)
  const prices: Prices = {}
  for (const item of items) {
    const pick = picks.get(item.id)
    if (!pick) continue
    for (const store of stores) {
      const row = pick[store] ? byKey.get(rowKey(store, pick[store])) : undefined
      const offer = row && offerOf(row, item.unit)
      if (offer) (prices[item.id] ??= {})[store] = offer
    }
  }
  return prices
}

// One line of the list at one store: how many units of sale and what they cost.
export const lineOf = (need: Need, offer: Offer) => ({
  packs: Math.ceil(need.amount / offer.base_qty - 1e-9),
  cost: cost(need.amount, offer),
})

export type Pricing = {
  // old: a menu saved before products (ADR 0024). none: nothing on the list could be priced.
  status: 'ok' | 'none' | 'old'
  items: Item[]
  needs: Need[]
  prices: Prices
  plan: StorePlan
  // What the List tab shows until the user picks otherwise, and what the budget is judged on: one store, or the split
  // when no store has the whole list.
  base: Option | null
  budget: number | null
  // base.total - budget: 0 or less fits.
  over: number | null
  // Over at one store, but the offered split fits.
  splitFits: boolean
  // The oldest checked_at among the products used.
  checkedAt: string | null
  // The menu's days, for the cost per day.
  days: number
}

export function pricing(menu: MenuData, have: Have, rows: ProductRow[]): Pricing {
  const items = buildList(menu)
  const needs = needsFor(items, have)
  const prices = pricesFor(items, menu, rows)
  const plan = planStores(needs, prices)
  const budget = menu.budget ?? null
  const base = plan.single ?? plan.split
  const over = budget != null && base ? base.total - budget : null
  const splitFits = over != null && over > 0 && !!plan.single && !!plan.split && plan.split.total <= budget!
  const used = new Set(
    Object.values(prices).flatMap((byStore) => Object.entries(byStore ?? {}).map(([store, o]) => rowKey(store, o!.sku!))),
  )
  const dates = rows.filter((row) => used.has(rowKey(row.store_key, row.store_sku))).map((row) => row.checked_at)
  const status = !menu.products ? 'old' : needs.length > plan.notFound.length ? 'ok' : 'none'
  const checkedAt = dates.sort()[0] ?? null
  return { status, items, needs, prices, plan, base, budget, over, splitFits, checkedAt, days: menu.days.length }
}

const pesos = (n: number) => `$${Math.round(n)}`
const optionText = (o: Option) => (o.stores.length === 1 ? `all at ${o.stores[0]} ${pesos(o.total)}` : `${o.stores.join(' + ')} ${pesos(o.total)}`)

// The price as the chat model reads it after save_menu and the list tools: in English, short, catalog keys only (no
// scraped product names), so it can answer about cost and fit the budget. Quoted numbers must come from here.
export function verdict(p: Pricing): string {
  if (p.status === 'old') return 'Not priced: this menu has no products. Save it again with products from search_products.'
  if (p.status === 'none') return 'Not priced: none of the picked products could be priced. Search again and pick others.'
  const { plan, base } = p
  const parts: string[] = []
  if (base) parts.push(`Cheapest: ${optionText(base)}${plan.single && plan.split ? `; or split ${optionText(plan.split)}` : ''}.`)
  else parts.push('No one store or pair has the whole list.')
  // What the screen shows under the total (ADR 0028); a one-day menu's total already is that.
  if (base && p.days > 1) parts.push(`Per day (${p.days} days): ${pesos(base.total / p.days)}.`)
  parts.push(`Per store: ${plan.perStore.map((s) => `${s.store} ${pesos(s.total)}${s.missing ? ` (${s.missing} missing)` : ''}`).join(', ')}.`)
  if (plan.notFound.length) parts.push(`Not priced: ${plan.notFound.join(', ')}.`)
  if (p.over != null) {
    if (p.over <= 0) parts.push(`Budget ${pesos(p.budget!)}: fits, ${pesos(-p.over)} left.`)
    else {
      parts.push(`Budget ${pesos(p.budget!)}: over by ${pesos(p.over)}${p.splitFits ? ` at one store, fits if split (${optionText(plan.split!)})` : ''}.`)
      parts.push(`Costliest: ${costliest(p).join(', ')}.`)
    }
  }
  return parts.join(' ')
}

// The five costliest lines of the base option, as item id and pesos, for the model to swap when over budget.
export function costliest(p: Pricing, n = 5): string[] {
  if (!p.base) return []
  return p.needs
    .flatMap((need) => {
      const store = p.base!.at[need.id]
      const offer = store && p.prices[need.id]?.[store]
      return offer ? [{ id: need.id, cost: cost(need.amount, offer) }] : []
    })
    .sort((a, b) => b.cost - a.cost)
    .slice(0, n)
    .map((line) => `${line.id} ${pesos(line.cost)}`)
}
