// Real products for the menu (ADR 0024): what the chat's search_products tool shows the model, how a store_products
// row becomes an offer in a list item's unit, and what save_menu checks about the products the model picked.
// Plain TS shared by the chat function and the web app, so no Deno or DOM globals here.
import type { Unit } from './catalog.ts'
import { buildList, itemId, type Item } from './list.ts'
import type { MenuData, ProductPick } from './menu.ts'
import { stores, type Offer, type StoreKey } from './stores.ts'

// The store_products columns the List tab and the chat read for the picked products, with the store's site for links.
export const productColumns =
  'store_key, store_sku, name, url_path, base_qty, base_unit, size_qty, size_unit, size_source, price, currency, availability, checked_at, stores(base_url)'
export type ProductRow = {
  store_key: string
  store_sku: string
  name: string
  url_path: string
  base_qty: number | null
  base_unit: string | null
  size_qty: number | null
  size_unit: string | null
  size_source: string | null
  price: number | null
  currency: string | null
  availability: string | null
  checked_at: string
  stores?: { base_url: string } | null
}
// A row this much older than its store's newest read is no longer listed by the store, so a saved pick that points at
// it counts as not sold there. search_products uses the same window when the agent picks
// (supabase/migrations/*_product_search_ranking.sql).
export const FRESH_DAYS = 14
// Each store's newest checked_at, as the store_newest() RPC returns it (supabase/migrations/*_store_newest.sql).
export type Newest = { store_key: string; newest: string | null }[]

// The rows still listed. A store with no newest read keeps all of its rows.
export function freshRows<T extends Pick<ProductRow, 'store_key' | 'checked_at'>>(rows: T[], newest: Newest): T[] {
  const cutoff = new Map(
    newest.flatMap(({ store_key, newest }) => (newest ? [[store_key, Date.parse(newest) - FRESH_DAYS * 86_400_000]] : [])),
  )
  return rows.filter((row) => Date.parse(row.checked_at) > (cutoff.get(row.store_key) ?? -Infinity))
}

// One row of the search_products RPC (supabase/migrations/*_product_search.sql).
export type SearchRow = Pick<
  ProductRow,
  'store_key' | 'store_sku' | 'name' | 'base_qty' | 'base_unit' | 'size_qty' | 'size_unit' | 'size_source'
> & { brand: string | null; price: number; unit_price: number | null; category: string | null }

// The scraper's size units (scraper/sizes.py), in g, ml or un.
const units: Record<string, [Unit, number]> = {
  g: ['g', 1], gr: ['g', 1], grs: ['g', 1], gramos: ['g', 1],
  kg: ['g', 1000], kgs: ['g', 1000], kilo: ['g', 1000], k: ['g', 1000],
  ml: ['ml', 1], cc: ['ml', 1], cm3: ['ml', 1],
  l: ['ml', 1000], lt: ['ml', 1000], lts: ['ml', 1000], litro: ['ml', 1000], litros: ['ml', 1000],
  un: ['un', 1], u: ['un', 1], unid: ['un', 1], unidad: ['un', 1], unidades: ['un', 1],
}
const isUnit = (unit: string | null): unit is Unit => unit === 'g' || unit === 'ml' || unit === 'un'

// What you add to the cart: one unit of sale, its content in g, ml or un, and its price. For a 'unit' row (a weighable
// GDU piece, or a Ta-Ta tray or piece sold by weight) the price is for base_qty and one unit of sale is size_qty size_unit
// (ADR 0023); otherwise the row is a pack of base_qty. null when the row can't be bought or priced.
export function unitOfSale(row: ProductRow | SearchRow): { qty: number; unit: Unit; price: number } | null {
  if (!(row.price != null && row.price > 0)) return null
  if ('currency' in row && row.currency && row.currency !== 'UYU') return null
  if ('availability' in row && row.availability === 'OutOfStock') return null
  if (!(row.base_qty != null && row.base_qty > 0) || !isUnit(row.base_unit)) return null
  const size = row.size_unit ? units[row.size_unit.toLowerCase()] : undefined
  if (row.size_source === 'unit' && size && size[0] === row.base_unit && row.size_qty != null && row.size_qty > 0) {
    const qty = row.size_qty * size[1]
    return { qty, unit: row.base_unit, price: (row.price * qty) / row.base_qty }
  }
  return { qty: row.base_qty, unit: row.base_unit, price: row.price }
}

// One unit of sale in the item's unit. g and ml stand in for each other (yogurt sold in ml, measured in g).
function inUnit(sale: { qty: number; unit: Unit }, unit: Unit): number | null {
  if (sale.unit === unit) return sale.qty
  return sale.unit !== 'un' && unit !== 'un' ? sale.qty : null
}

// The offer behind a picked product for an item measured in unit: whole units of sale, for stores.ts cost().
export function offerOf(row: ProductRow, unit: Unit): Offer | null {
  const sale = unitOfSale(row)
  const qty = sale && inUnit(sale, unit)
  if (!sale || !qty) return null
  const url = row.stores?.base_url ? `${row.stores.base_url}${row.url_path}` : undefined
  const offer: Offer = { price: sale.price, base_qty: qty, sku: row.store_sku, name: row.name, url }
  if (row.size_source === 'unit') offer.weighed = true
  return offer
}

export const rowKey = (store: string, sku: string) => `${store}:${sku}`

// The picks by list item id. A later pick for the same item wins.
export function picksByItem(menu: MenuData): Map<string, ProductPick> {
  return new Map((menu.products ?? []).map((pick) => [itemId(pick.food, pick.other_name, pick.unit), pick]))
}

// The skus to read per store, for the queries (Disco and Géant share sku ids, so each is read with its store).
export function skusByStore(menu: MenuData): Record<StoreKey, string[]> {
  const skus = Object.fromEntries(stores.map((store) => [store, new Set<string>()])) as Record<StoreKey, Set<string>>
  for (const pick of menu.products ?? []) {
    for (const store of stores) if (pick[store]) skus[store].add(pick[store])
  }
  return Object.fromEntries(stores.map((store) => [store, [...skus[store]]])) as Record<StoreKey, string[]>
}

const label = (item: Item) => `${item.other_name ?? item.food} (${item.unit})`

// What save_menu must have the model fix: every list item has a product at some store, and each picked sku is sold
// there and can be bought in the item's unit. rows: the picked skus as read from store_products.
export function productProblems(menu: MenuData, rows: ProductRow[]): string[] {
  const byKey = new Map(rows.map((row) => [rowKey(row.store_key, row.store_sku), row]))
  const picks = picksByItem(menu)
  return buildList(menu).flatMap((item) => {
    const pick = picks.get(item.id)
    if (!pick || stores.every((store) => !pick[store])) {
      return [`${label(item)}: no product picked. Search for it and add it to products, or use another food.`]
    }
    return stores.flatMap((store) => {
      const sku = pick[store]
      if (!sku) return []
      const row = byKey.get(rowKey(store, sku))
      if (!row || !unitOfSale(row)) return [`${label(item)}: ${sku} isn't for sale at ${store}. Pick one from search_products, or null.`]
      if (!offerOf(row, item.unit)) {
        return [`${label(item)}: ${sku} at ${store} is sold by ${row.base_unit}, not ${item.unit}. Pick another, or change the unit.`]
      }
      return []
    })
  })
}

// "800 g", "1,5 kg", "12 un"
function amount(qty: number, unit: Unit) {
  const n = (x: number) => String(Math.round(x * 100) / 100)
  if (unit !== 'un' && qty >= 1000) return `${n(qty / 1000)} ${unit === 'g' ? 'kg' : 'L'}`
  return `${n(qty)} ${unit}`
}

// The search results as the model reads them: per query and store, one short line per product with what one unit of
// sale is and what it costs, and the price per kg, L or unit to compare. Capped, since tool results stay in the history.
export function searchText(results: { query: string; rows: SearchRow[] }[], maxChars = 14000): string {
  const out: string[] = []
  let size = 0
  for (const { query, rows } of results) {
    const lines = [`## ${query}`]
    for (const store of stores) {
      for (const row of rows.filter((r) => r.store_key === store)) {
        const sale = unitOfSale(row)
        const per = sale && (sale.unit === 'un' ? `$${Math.round(sale.price / sale.qty)}/un` : `$${Math.round((sale.price / sale.qty) * 1000)}/${sale.unit === 'g' ? 'kg' : 'L'}`)
        const what = sale ? `${amount(sale.qty, sale.unit)} for $${Math.round(sale.price)} (${per})` : 'size unknown'
        lines.push(`${store} ${row.store_sku} | ${row.name.slice(0, 60)} | ${what}`)
      }
    }
    if (lines.length === 1) lines.push('nothing found')
    const block = lines.join('\n')
    if (size + block.length > maxChars) {
      out.push('(more results cut: search fewer foods per call)')
      break
    }
    out.push(block)
    size += block.length + 1
  }
  return out.join('\n')
}
