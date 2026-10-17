// The weekly menu the chat's save_menu tool writes and the Menu tab reads.
// Plain TS shared by the chat function and the web app, so no Deno or DOM globals here.
import { catalog, type CatalogKey, type Unit } from './catalog.ts'

export const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Day = (typeof days)[number]

// amount is per serving, raw as bought, in unit.
export type Ingredient = { food: CatalogKey | 'other'; other_name: string | null; amount: number; unit: Unit }
export type Recipe = { id: string; name: string; how: string; ingredients: Ingredient[] }
export type MenuData = { recipes: Recipe[]; days: { day: Day; meals: { slot: string; recipe_id: string }[] }[] }

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

// What strict mode can't enforce. Lowercases food and day keys in place; returns what the model must fix.
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
  for (const day of days) {
    if (menu.days.filter((entry) => entry.day === day).length !== 1) problems.push(`${day} must appear exactly once.`)
  }
  return problems
}
