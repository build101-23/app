import { test } from 'node:test'
import assert from 'node:assert/strict'
import { days, type MenuData } from './menu.ts'
import { freshRows, offerOf, productProblems, searchText, skusByStore, unitOfSale, type SearchRow } from './products.ts'
import { row } from './testing.ts'

const menu = (products: MenuData['products']): MenuData => ({
  recipes: [
    {
      id: 'a',
      name: 'Arroz con huevo',
      how: 'Hervir.',
      ingredients: [
        { food: 'rice', other_name: null, amount: 100, unit: 'g' },
        { food: 'egg', other_name: null, amount: 2, unit: 'un' },
      ],
    },
  ],
  days: days.slice(5).map((day) => ({ day, meals: [{ slot: 'Cena', recipe_id: 'a' }] })),
  budget: null,
  products,
})

test('a pack is one unit of sale at its price', () => {
  assert.deepEqual(unitOfSale(row({ store_key: 'tata', store_sku: '1', base_qty: 500, price: 60 })), { qty: 500, unit: 'g', price: 60 })
})

test('a weighable piece is priced per kg and sold by the piece', () => {
  // GDU: $ 329 / kg, "x 250 g" pieces (ADR 0023).
  const piece = row({ store_key: 'disco', store_sku: '301223', base_qty: 1000, size_source: 'unit', size_qty: 250, size_unit: 'g', price: 329 })
  assert.deepEqual(unitOfSale(piece), { qty: 250, unit: 'g', price: 82.25 })
  // Ta-Ta: a 1.4 kg piece at 199/kg.
  const loin = row({ store_key: 'tata', store_sku: '13220', base_qty: 1000, size_source: 'unit', size_qty: 1.4, size_unit: 'kg', price: 199 })
  assert.deepEqual(unitOfSale(loin), { qty: 1400, unit: 'g', price: 278.6 })
  // A 1 kg tray is one tray.
  const tray = row({ store_key: 'tata', store_sku: '14482', base_qty: 1000, size_source: 'unit', size_qty: 1, size_unit: 'kg', price: 89 })
  assert.deepEqual(unitOfSale(tray), { qty: 1000, unit: 'g', price: 89 })
})

test('no price, another currency, out of stock or no size: not for sale', () => {
  assert.equal(unitOfSale(row({ store_key: 'disco', store_sku: '1', price: null })), null)
  assert.equal(unitOfSale(row({ store_key: 'disco', store_sku: '1', currency: 'USD' })), null)
  assert.equal(unitOfSale(row({ store_key: 'disco', store_sku: '1', availability: 'OutOfStock' })), null)
  assert.equal(unitOfSale(row({ store_key: 'disco', store_sku: '1', base_qty: null })), null)
})

test('an offer is in the item unit, with g and ml standing in for each other, never un', () => {
  const yogurt = row({ store_key: 'tata', store_sku: '7', base_qty: 1000, base_unit: 'ml', price: 120 })
  assert.deepEqual(offerOf(yogurt, 'g'), { price: 120, base_qty: 1000, sku: '7', name: 'Producto 7', url: 'https://www.example.uy/p/7' })
  assert.equal(offerOf(row({ store_key: 'tata', store_sku: '8', base_qty: 1, base_unit: 'un' }), 'g'), null)
})

test('save_menu needs a product for every item, sold at that store, in its unit', () => {
  const rows = [
    row({ store_key: 'disco', store_sku: '10' }),
    row({ store_key: 'tata', store_sku: '20', base_qty: 12, base_unit: 'un' }),
    row({ store_key: 'geant', store_sku: '30', price: null }),
  ]
  const pick = (food: 'rice' | 'egg', disco: string | null, geant: string | null, tata: string | null) => ({
    food,
    other_name: null,
    unit: food === 'rice' ? ('g' as const) : ('un' as const),
    disco,
    geant,
    tata,
  })
  assert.deepEqual(productProblems(menu([pick('rice', '10', null, null), pick('egg', null, null, '20')]), rows), [])
  assert.deepEqual(productProblems(menu([pick('rice', '10', '30', null)]), rows), [
    "rice (g): 30 isn't for sale at geant. Pick one from search_products, or null.",
    'egg (un): no product picked. Search for it and add it to products, or use another food.',
  ])
  assert.deepEqual(productProblems(menu([pick('rice', null, null, '20'), pick('egg', null, null, null)]), rows), [
    'rice (g): 20 at tata is sold by un, not g. Pick another, or change the unit.',
    'egg (un): no product picked. Search for it and add it to products, or use another food.',
  ])
})

test('a row 14 days older than its store\'s newest read is no longer listed', () => {
  const rows = [
    row({ store_key: 'tata', store_sku: '1', checked_at: '2026-10-04T12:00:01Z' }),
    row({ store_key: 'tata', store_sku: '2', checked_at: '2026-10-04T12:00:00Z' }),
    // Géant's newest read is older, so the same date is still fresh there.
    row({ store_key: 'geant', store_sku: '2', checked_at: '2026-10-04T12:00:00Z' }),
    // A store with no newest read keeps its rows.
    row({ store_key: 'disco', store_sku: '3', checked_at: '2020-01-01T00:00:00Z' }),
  ]
  const newest = [
    { store_key: 'tata', newest: '2026-10-18T12:00:00Z' },
    { store_key: 'geant', newest: '2026-10-10T12:00:00Z' },
    { store_key: 'disco', newest: null },
  ]
  assert.deepEqual(
    freshRows(rows, newest).map((r) => `${r.store_key}:${r.store_sku}`),
    ['tata:1', 'geant:2', 'disco:3'],
  )
  assert.equal(freshRows(rows, []).length, 4)
})

test('skus are read per store, once each', () => {
  const m = menu([
    { food: 'rice', other_name: null, unit: 'g', disco: '10', geant: '10', tata: null },
    { food: 'egg', other_name: null, unit: 'un', disco: '10', geant: null, tata: '20' },
  ])
  assert.deepEqual(skusByStore(m), { disco: ['10'], geant: ['10'], tata: ['20'] })
})

test('search results are short lines per query and store, capped', () => {
  const found: SearchRow[] = [
    { ...row({ store_key: 'tata', store_sku: '3883', name: 'Suprema De Pollo En Bandeja 690 g', base_qty: 690, price: 406.41 }), brand: null, unit_price: 589, category: null },
    { ...row({ store_key: 'disco', store_sku: '372650', name: 'Suprema Tenent en bandeja x 800 g', size_source: 'unit', size_qty: 800, size_unit: 'g', price: 289 }), brand: null, unit_price: 289, category: null },
  ] as SearchRow[]
  assert.equal(
    searchText([{ query: 'suprema', rows: found }, { query: 'quinoa', rows: [] }]),
    [
      '## suprema',
      'disco 372650 | Suprema Tenent en bandeja x 800 g | 800 g for $231 ($289/kg)',
      'tata 3883 | Suprema De Pollo En Bandeja 690 g | 690 g for $406 ($589/kg)',
      '## quinoa',
      'nothing found',
    ].join('\n'),
  )
  assert.match(searchText([{ query: 'suprema', rows: found }], 10), /^\(more results cut/)
})
