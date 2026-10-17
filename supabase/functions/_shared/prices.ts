// ⚠️ TEMPORARY, MADE-UP PRICES. Delete per ADR 0019 (checklist there).
// shortcut: hardcoded example prices so the store rule and the List tab ship before catalog foods are matched to store_products.
// Plain TS shared by the web app, so no Deno or DOM globals here.
import { catalog, type CatalogKey } from './catalog.ts'
import type { Offer, Prices, StoreKey } from './stores.ts'

// Montevideo noon: a date-only string parses as UTC and would show the day before.
export const pricesDate = '2026-10-17T12:00:00-03:00'

// UYU for the catalog's pack, or per kg or L when the catalog sells the food loose (per unit for lettuce).
// Disco is the reference, with the spike's prices where we have them. Each store lacks one niche food.
const seed = {
  chicken_breast: { disco: 350, geant: 345, tata: 329 },
  chicken_leg: { disco: 180, geant: 180, tata: 169 },
  ground_beef: { disco: 390, geant: 385, tata: 369 },
  beef_round: { disco: 450, geant: 450, tata: 429 },
  pork_loin: { disco: 380, geant: 380, tata: 359 },
  ham: { disco: 520, geant: 510, tata: 560 },
  egg: { disco: 150, geant: 150, tata: 162 },
  canned_tuna: { disco: 89, geant: 85, tata: 84 },
  hake_fillet: { disco: 420, geant: 420, tata: 399 },
  milk: { disco: 69, geant: 69, tata: 80 },
  yogurt: { disco: 120, geant: 120, tata: 132 },
  cheese: { disco: 480, geant: 470, tata: 515 },
  ricotta: { disco: 140, geant: 135 },
  cream_cheese: { disco: 135, geant: 135, tata: 148 },
  butter: { disco: 125, geant: 122, tata: 140 },
  rice: { disco: 95, geant: 95, tata: 92 },
  pasta: { disco: 55, geant: 55, tata: 52 },
  oats: { disco: 59, geant: 69, tata: 57 },
  flour: { disco: 53, geant: 53, tata: 50 },
  bread: { disco: 160, geant: 160, tata: 155 },
  sliced_bread: { disco: 110, geant: 105, tata: 104 },
  polenta: { disco: 48, geant: 48, tata: 49 },
  lentils: { disco: 65, geant: 65, tata: 62 },
  chickpeas: { disco: 85, geant: 79, tata: 82 },
  beans: { disco: 75, geant: 75, tata: 71 },
  crushed_tomato: { disco: 75, geant: 72, tata: 70 },
  tart_crust: { disco: 85, tata: 89 },
  breadcrumbs: { disco: 70, geant: 70, tata: 66 },
  sunflower_oil: { disco: 99, geant: 99, tata: 94 },
  olive_oil: { disco: 390, geant: 380, tata: 375 },
  sugar: { disco: 58, geant: 58, tata: 55 },
  peanuts: { disco: 85, geant: 85, tata: 80 },
  peanut_butter: { disco: 180, geant: 175, tata: 172 },
  rice_cakes: { disco: 65, geant: 65, tata: 62 },
  crackers: { disco: 45, geant: 45, tata: 43 },
  potato: { disco: 45, geant: 45, tata: 49 },
  sweet_potato: { disco: 55, geant: 52, tata: 60 },
  onion: { disco: 45, geant: 45, tata: 49 },
  carrot: { disco: 50, geant: 50, tata: 55 },
  tomato: { disco: 89, geant: 85, tata: 98 },
  lettuce: { disco: 45, geant: 45, tata: 49 },
  zucchini: { disco: 70, geant: 69, tata: 78 },
  pumpkin: { disco: 40, geant: 40, tata: 44 },
  bell_pepper: { disco: 150, geant: 145, tata: 165 },
  chard: { geant: 90, tata: 98 },
  broccoli: { disco: 160, geant: 160, tata: 175 },
  garlic: { disco: 280, geant: 275, tata: 299 },
  banana: { disco: 85, geant: 85, tata: 92 },
  apple: { disco: 95, geant: 95, tata: 104 },
  orange: { disco: 55, geant: 55, tata: 60 },
  mandarin: { disco: 70, geant: 69, tata: 76 },
  lemon: { disco: 70, geant: 70, tata: 78 },
  canned_peas: { disco: 45, geant: 45, tata: 42 },
  canned_corn: { disco: 55, geant: 52, tata: 52 },
} satisfies Record<CatalogKey, Partial<Record<StoreKey, number>>>

// Every store sells the catalog's pack, so a list line's "2 × 1 kg" holds everywhere. Lettuce, loose but counted
// in units, is a 1-unit pack: it's bought by the head, as its line shows.
const offer = (food: CatalogKey, price: number): Offer => {
  const { unit, pack } = catalog[food]
  return { price, base_qty: pack ?? (unit === 'un' ? 1 : 1000), by_weight: pack === null && unit !== 'un' }
}

export const examplePrices: Prices = Object.fromEntries(
  Object.entries(seed).map(([food, row]) => [
    food,
    Object.fromEntries(Object.entries(row).map(([store, price]) => [store, offer(food as CatalogKey, price)])),
  ]),
)
