// How the List tab and its cart buttons write a list item's name and an amount of pesos.
import type { CatalogKey } from '../supabase/functions/_shared/catalog.ts'
import type { Item } from '../supabase/functions/_shared/list.ts'
import { t } from './strings'

export const nameOf = (item: Item) => item.other_name ?? t.foods[item.food as CatalogKey]

// "$ 1.937"
export const money = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format
