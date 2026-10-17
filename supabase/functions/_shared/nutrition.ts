// What each catalog food contains, for the numbers switch: the Menu tab adds it up, and save_menu shows it to the model.
// Plain TS shared by the chat function and the web app, so no Deno or DOM globals here.
import { catalog, type CatalogKey } from './catalog.ts'
import type { Ingredient } from './menu.ts'

export type Macros = { kcal: number; protein: number; carbs: number; fat: number }

// [kcal, protein g, carbs g, fat g] per 100 g or 100 ml raw as bought, or per unit for foods counted in units.
// Carbs leave fiber out, like Uruguayan labels. Canned foods are per net weight, liquid included; fruit per edible part.
// shortcut: rounded values from standard food tables, not the products we price; about ±15%. Use label data once foods are matched to products.
export const nutrition = {
  chicken_breast: [120, 22.5, 0, 2.6],
  chicken_leg: [140, 13, 0, 9.5], // with bone
  ground_beef: [215, 18.6, 0, 15],
  beef_round: [135, 22, 0, 5],
  pork_loin: [140, 21, 0, 6],
  ham: [120, 18, 2, 4.5],
  egg: [72, 6.3, 0.4, 4.8], // one egg
  canned_tuna: [82, 18, 0, 0.6],
  hake_fillet: [86, 18, 0, 1.3],
  milk: [60, 3.1, 4.8, 3],
  yogurt: [61, 3.5, 4.7, 3.3],
  cheese: [340, 24, 1, 27],
  ricotta: [150, 10, 3.5, 10.5],
  cream_cheese: [250, 7, 4, 23],
  butter: [717, 0.9, 0.1, 81],
  rice: [360, 7, 79, 0.6],
  pasta: [360, 12, 74, 1.5],
  oats: [370, 13, 60, 7],
  flour: [350, 10, 73, 1.2],
  bread: [270, 9, 55, 1.5],
  sliced_bread: [265, 8.5, 48, 4],
  polenta: [360, 7.5, 77, 1.4],
  lentils: [340, 24, 50, 1.1],
  chickpeas: [360, 19, 47, 6],
  beans: [330, 22, 45, 1.2],
  crushed_tomato: [30, 1.4, 5, 0.2],
  tart_crust: [590, 12, 88, 21], // one disc
  breadcrumbs: [390, 13, 72, 5],
  sunflower_oil: [828, 0, 0, 92],
  olive_oil: [820, 0, 0, 91],
  sugar: [400, 0, 100, 0],
  peanuts: [570, 26, 8, 49],
  peanut_butter: [590, 25, 13, 50],
  rice_cakes: [385, 8, 80, 3],
  crackers: [420, 10, 70, 11],
  potato: [77, 2, 16, 0.1],
  sweet_potato: [86, 1.6, 18, 0.1],
  onion: [40, 1.1, 8, 0.1],
  carrot: [41, 0.9, 7, 0.2],
  tomato: [18, 0.9, 3, 0.2],
  lettuce: [35, 3, 3.5, 0.5], // one head
  zucchini: [17, 1.2, 3, 0.3],
  pumpkin: [30, 1, 6.5, 0.1],
  bell_pepper: [24, 1, 4.5, 0.2],
  chard: [19, 1.8, 2, 0.2],
  broccoli: [34, 2.8, 4, 0.4],
  garlic: [149, 6.4, 31, 0.5],
  banana: [89, 1.1, 20, 0.3],
  apple: [52, 0.3, 12, 0.2],
  orange: [47, 0.9, 9.5, 0.1],
  mandarin: [53, 0.8, 11.5, 0.3],
  lemon: [29, 1.1, 6.5, 0.3],
  canned_peas: [50, 3.2, 6.5, 0.3],
  canned_corn: [55, 1.7, 10.5, 0.7],
} as const satisfies Record<CatalogKey, readonly [number, number, number, number]>

// For save_menu's food list: "per 100 g: 120 kcal, 22.5 g protein, 0 g carbs, 2.6 g fat".
export function nutritionText(food: CatalogKey): string {
  const [kcal, protein, carbs, fat] = nutrition[food]
  const per = catalog[food].unit === 'un' ? 'per unit' : `per 100 ${catalog[food].unit}`
  return `${per}: ${kcal} kcal, ${protein} g protein, ${carbs} g carbs, ${fat} g fat`
}

// Adds up one serving of each ingredient. 'other' foods have no values: their names come back in missing.
export function addMacros(ingredients: Ingredient[]): Macros & { missing: string[] } {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, missing: [] as string[] }
  for (const item of ingredients) {
    if (item.food === 'other') {
      total.missing.push(item.other_name ?? '')
      continue
    }
    const [kcal, protein, carbs, fat] = nutrition[item.food]
    const n = catalog[item.food].unit === 'un' ? item.amount : item.amount / 100
    total.kcal += kcal * n
    total.protein += protein * n
    total.carbs += carbs * n
    total.fat += fat * n
  }
  return total
}
