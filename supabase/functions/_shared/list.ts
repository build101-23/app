// The shopping list: the week's menu added up, minus what the user has at home.
// Plain TS shared by the web app (List tab) and the chat function (update_shopping_list), so no Deno or DOM globals here.
import { catalog, type CatalogKey, type Section, type Unit } from './catalog.ts'
import type { Ingredient, MenuData } from './menu.ts'

// Item id → how much the user has at home, in the item's unit. null: enough, don't buy it.
export type Have = Record<string, number | null>

// amount: the week's total for one person, raw as bought. pack: from the catalog, null for 'other'.
export type Item = {
  id: string
  food: CatalogKey | 'other'
  other_name: string | null
  section: Section | 'other'
  unit: Unit
  amount: number
  pack: number | null
}

export const itemId = (food: Ingredient['food'], other_name: string | null, unit: Unit) =>
  food === 'other' ? `other:${unit}:${(other_name ?? '').trim().toLowerCase()}` : food

const round = (n: number) => Math.round(n * 100) / 100

// Each meal adds one serving of its recipe, so repeated recipes add up and unused ones add nothing.
export function buildList(menu: MenuData): Item[] {
  const recipes = new Map(menu.recipes.map((recipe) => [recipe.id, recipe]))
  const items = new Map<string, Item>()
  for (const { meals } of menu.days) {
    for (const meal of meals) {
      for (const ingredient of recipes.get(meal.recipe_id)?.ingredients ?? []) {
        // A key the catalog no longer has is listed like an 'other', named by its key.
        const known = Object.hasOwn(catalog, ingredient.food) ? catalog[ingredient.food as CatalogKey] : null
        const food = known ? ingredient.food : 'other'
        const other_name = known ? null : (ingredient.other_name ?? ingredient.food).trim()
        const id = itemId(food, other_name, ingredient.unit)
        const item = items.get(id)
        if (item) item.amount += ingredient.amount
        else {
          const section = known?.section ?? 'other'
          const pack = known?.pack ?? null
          items.set(id, { id, food, other_name, section, unit: ingredient.unit, amount: ingredient.amount, pack })
        }
      }
    }
  }
  return [...items.values()].map((item) => ({ ...item, amount: round(item.amount) }))
}

// Still to buy, unrounded: what prices are worked out on.
export function left(item: Item, have: Have): number {
  const at_home = Object.hasOwn(have, item.id) ? have[item.id] : 0
  return at_home === null ? 0 : Math.max(0, round(item.amount - at_home))
}

// What a food is bought in: its pack, single units, or 100 g or ml (10 for small amounts like garlic).
const stepOf = (item: Item) => item.pack ?? (item.unit === 'un' ? 1 : item.amount < 100 ? 10 : 100)

// What to buy, rounded up to whole steps. Never down: amounts are never cut (product rule 3). 0 is crossed out.
export function toBuy(item: Item, have: Have): number {
  const step = stepOf(item)
  return Math.ceil(left(item, have) / step) * step
}

// One step less (-1) or more (1) to buy. Nothing left to buy is stored as null; back at the menu's amount, the mark goes.
export function stepHave(item: Item, have: Have, dir: 1 | -1): Have {
  const next = { ...have }
  const buy = toBuy(item, have) + dir * stepOf(item)
  if (buy <= 0) next[item.id] = null
  else if (buy >= toBuy(item, {})) delete next[item.id]
  else next[item.id] = round(item.amount - buy)
  return next
}
