// Foods the menu can use, keyed in English; Spanish names live in src/strings.ts.
// Plain TS shared by the chat function and the web app, so no Deno or DOM globals here.
// shortcut: a fixed list of everyday foods, anything else goes in as 'other'; grow it or replace it with scraped products once prices are real.
// Keys are only ever added, never renamed or removed: saved menus point at them.
export type Unit = 'g' | 'ml' | 'un'
// Supermarket sections, in the order the shopping list shows them (roughly how you walk the store).
export type Section = 'produce' | 'pantry' | 'meat' | 'dairy'

// pack: the usual pack size in the food's unit, or null when it's sold loose or by weight.
// shortcut: typical sizes; only rice, oats, flour, polenta, oil and milk come from the price spike. Check them in a store before the pilot.
export const catalog = {
  chicken_breast: { unit: 'g', section: 'meat', pack: null },
  chicken_leg: { unit: 'g', section: 'meat', pack: null },
  ground_beef: { unit: 'g', section: 'meat', pack: null },
  beef_round: { unit: 'g', section: 'meat', pack: null },
  pork_loin: { unit: 'g', section: 'meat', pack: null },
  ham: { unit: 'g', section: 'dairy', pack: null },
  egg: { unit: 'un', section: 'dairy', pack: 12 },
  canned_tuna: { unit: 'g', section: 'pantry', pack: 170 },
  hake_fillet: { unit: 'g', section: 'meat', pack: null },
  milk: { unit: 'ml', section: 'dairy', pack: 1000 },
  yogurt: { unit: 'g', section: 'dairy', pack: 1000 },
  cheese: { unit: 'g', section: 'dairy', pack: null },
  ricotta: { unit: 'g', section: 'dairy', pack: 500 },
  cream_cheese: { unit: 'g', section: 'dairy', pack: 300 },
  butter: { unit: 'g', section: 'dairy', pack: 200 },
  rice: { unit: 'g', section: 'pantry', pack: 1000 },
  pasta: { unit: 'g', section: 'pantry', pack: 500 },
  oats: { unit: 'g', section: 'pantry', pack: 400 },
  flour: { unit: 'g', section: 'pantry', pack: 1000 },
  bread: { unit: 'g', section: 'pantry', pack: null },
  sliced_bread: { unit: 'g', section: 'pantry', pack: 500 },
  polenta: { unit: 'g', section: 'pantry', pack: 450 },
  lentils: { unit: 'g', section: 'pantry', pack: 400 },
  chickpeas: { unit: 'g', section: 'pantry', pack: 400 },
  beans: { unit: 'g', section: 'pantry', pack: 400 },
  crushed_tomato: { unit: 'g', section: 'pantry', pack: 1000 },
  tart_crust: { unit: 'un', section: 'dairy', pack: 2 },
  breadcrumbs: { unit: 'g', section: 'pantry', pack: 500 },
  sunflower_oil: { unit: 'ml', section: 'pantry', pack: 900 },
  olive_oil: { unit: 'ml', section: 'pantry', pack: 500 },
  sugar: { unit: 'g', section: 'pantry', pack: 1000 },
  peanuts: { unit: 'g', section: 'pantry', pack: 200 },
  peanut_butter: { unit: 'g', section: 'pantry', pack: 350 },
  rice_cakes: { unit: 'g', section: 'pantry', pack: 100 },
  crackers: { unit: 'g', section: 'pantry', pack: 120 },
  potato: { unit: 'g', section: 'produce', pack: null },
  sweet_potato: { unit: 'g', section: 'produce', pack: null },
  onion: { unit: 'g', section: 'produce', pack: null },
  carrot: { unit: 'g', section: 'produce', pack: null },
  tomato: { unit: 'g', section: 'produce', pack: null },
  lettuce: { unit: 'un', section: 'produce', pack: null },
  zucchini: { unit: 'g', section: 'produce', pack: null },
  pumpkin: { unit: 'g', section: 'produce', pack: null },
  bell_pepper: { unit: 'g', section: 'produce', pack: null },
  chard: { unit: 'g', section: 'produce', pack: null },
  broccoli: { unit: 'g', section: 'produce', pack: null },
  garlic: { unit: 'g', section: 'produce', pack: null },
  banana: { unit: 'g', section: 'produce', pack: null },
  apple: { unit: 'g', section: 'produce', pack: null },
  orange: { unit: 'g', section: 'produce', pack: null },
  mandarin: { unit: 'g', section: 'produce', pack: null },
  lemon: { unit: 'g', section: 'produce', pack: null },
  canned_peas: { unit: 'g', section: 'pantry', pack: 300 },
  canned_corn: { unit: 'g', section: 'pantry', pack: 300 },
} as const satisfies Record<string, { unit: Unit; section: Section; pack: number | null }>

export type CatalogKey = keyof typeof catalog
