// The menu the chat's save_menu tool writes and the Menu tab reads: one to seven days, in calendar order (ADR 0024,
// ADR 0028).
// Plain TS shared by the chat function and the web app, so no Deno or DOM globals here.
import { catalog, type CatalogKey, type Unit } from './catalog.ts'
import type { StoreKey } from './stores.ts'

export const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Day = (typeof days)[number]

// amount is per serving, raw as bought, in unit.
export type Ingredient = { food: CatalogKey | 'other'; other_name: string | null; amount: number; unit: Unit }
export type Recipe = { id: string; name: string; how: string; ingredients: Ingredient[] }
// For one list item, the product the chat agent picked at each store from search_products: a store_sku, or null where
// it found none. Menus saved before ADR 0024 have no products and no budget.
export type ProductPick = Pick<Ingredient, 'food' | 'other_name' | 'unit'> & Record<StoreKey, string | null>
// budget: whole pesos for this shopping, only when the user gave one.
export type MenuData = {
  recipes: Recipe[]
  days: { day: Day; meals: { slot: string; recipe_id: string }[] }[]
  budget?: number | null
  products?: ProductPick[]
}

// What strict mode can't enforce about one food: a catalog key in its unit, or a named 'other'.
// Lowercases the key in place. Also used by the chat's update_shopping_list.
export function foodProblems(item: Pick<Ingredient, 'food' | 'other_name' | 'unit'>, where: string): string[] {
  item.food = item.food.toLowerCase() as Ingredient['food']
  const known = Object.hasOwn(catalog, item.food) ? catalog[item.food as CatalogKey] : null
  if (item.food === 'other') {
    return item.other_name?.trim() ? [] : [`${where}: an 'other' ingredient has no other_name.`]
  }
  if (!known) return [`${where}: ${item.food} is not in the catalog.`]
  if (known.unit !== item.unit) return [`${where}: ${item.food} is measured in ${known.unit}, not ${item.unit}.`]
  return []
}

// save_menu isn't strict (ADR 0024: its grammar went over the API's cap), so this checks the input's shape first:
// what menuProblems reads must be there. Returns what the model must fix, or nothing.
export function menuShapeProblems(input: unknown): string[] {
  const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
  const isText = (x: unknown) => typeof x === 'string'
  const isNullableText = (x: unknown) => x === null || typeof x === 'string'
  const isUnit = (x: unknown) => x === 'g' || x === 'ml' || x === 'un'
  if (!isObject(input)) return ['The menu must be an object with recipes, days, budget and products.']
  const problems: string[] = []
  if (!Array.isArray(input.recipes)) problems.push('recipes must be a list.')
  else {
    input.recipes.forEach((recipe, i) => {
      const where = `Recipe ${i + 1}`
      if (!isObject(recipe) || !isText(recipe.id) || !isText(recipe.name) || !isText(recipe.how)) {
        return problems.push(`${where}: needs id, name and how, as text.`)
      }
      if (!Array.isArray(recipe.ingredients)) return problems.push(`${where}: ingredients must be a list.`)
      recipe.ingredients.forEach((item, j) => {
        const ok = isObject(item) && isText(item.food) && isNullableText(item.other_name) && typeof item.amount === 'number' && isUnit(item.unit)
        if (!ok) problems.push(`${where}, ingredient ${j + 1}: needs food (text), other_name (text or null), amount (number) and unit (g, ml or un).`)
      })
    })
  }
  if (!Array.isArray(input.days)) problems.push('days must be a list.')
  else {
    input.days.forEach((entry, i) => {
      const ok =
        isObject(entry) && (days as readonly unknown[]).includes(typeof entry.day === 'string' ? entry.day.toLowerCase() : entry.day) &&
        Array.isArray(entry.meals) && entry.meals.every((meal) => isObject(meal) && isText(meal.slot) && isText(meal.recipe_id))
      if (!ok) problems.push(`Day ${i + 1}: needs day (monday to sunday) and meals, each with slot and recipe_id.`)
    })
  }
  if (input.budget !== undefined && input.budget !== null && typeof input.budget !== 'number') problems.push('budget must be a number or null.')
  if (input.products !== undefined && !Array.isArray(input.products)) problems.push('products must be a list.')
  if (Array.isArray(input.products)) {
    input.products.forEach((pick, i) => {
      const ok =
        isObject(pick) && isText(pick.food) && isNullableText(pick.other_name) && isUnit(pick.unit) &&
        isNullableText(pick.disco) && isNullableText(pick.geant) && isNullableText(pick.tata)
      if (!ok) problems.push(`Product ${i + 1}: needs food, other_name, unit, and disco, geant and tata (a sku or null).`)
    })
  }
  return problems
}

// What the input's shape doesn't settle. Lowercases food and day keys in place; returns what the model must fix.
export function menuProblems(menu: MenuData): string[] {
  const problems: string[] = []
  for (const recipe of menu.recipes) {
    for (const item of recipe.ingredients) {
      problems.push(...foodProblems(item, `Recipe ${recipe.id}`))
      if (!(item.amount > 0)) problems.push(`Recipe ${recipe.id}: ${item.food} needs an amount above 0.`)
    }
  }
  const ids = new Set(menu.recipes.map((recipe) => recipe.id))
  for (const entry of menu.days) {
    entry.day = entry.day.toLowerCase() as Day
    for (const meal of entry.meals) {
      if (!ids.has(meal.recipe_id)) problems.push(`${entry.day}: recipe ${meal.recipe_id} doesn't exist.`)
    }
  }
  if (!menu.days.length) problems.push('The menu needs at least one day.')
  // Each day comes after the one before, counting from the first: sunday then monday, gaps fine, never twice.
  const first = days.indexOf(menu.days[0]?.day)
  const after = (day: Day) => (days.indexOf(day) - first + days.length) % days.length
  menu.days.forEach(({ day }, i) => {
    const before = menu.days[i - 1]?.day
    if (before && after(day) <= after(before)) {
      problems.push(`Day ${i + 1} (${day}) must come after ${before}: days go in order from the first one, sunday then monday, each once.`)
    }
  })
  if (menu.budget != null && !(menu.budget > 0)) problems.push('budget must be null or above 0.')
  for (const [i, pick] of (menu.products ?? []).entries()) problems.push(...foodProblems(pick, `Product ${i + 1}`))
  return problems
}
