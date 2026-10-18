import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Have } from './list.ts'
import { days, type MenuData, type ProductPick } from './menu.ts'
import { costliest, lineOf, needsFor, pricing, verdict } from './offers.ts'
import { row } from './testing.ts'
import { planStores } from './stores.ts'

// Two days of rice (2 × 300 g) and chicken (2 × 300 g), priced at each store.
const pick = (food: 'rice' | 'chicken_breast', disco: string | null, geant: string | null, tata: string | null): ProductPick => ({
  food,
  other_name: null,
  unit: 'g',
  disco,
  geant,
  tata,
})
const menu = (budget: number | null, products?: ProductPick[]): MenuData => ({
  recipes: [
    {
      id: 'a',
      name: 'Pollo con arroz',
      how: 'Al horno.',
      ingredients: [
        { food: 'rice', other_name: null, amount: 300, unit: 'g' },
        { food: 'chicken_breast', other_name: null, amount: 300, unit: 'g' },
      ],
    },
  ],
  days: days.slice(5).map((day) => ({ day, meals: [{ slot: 'Cena', recipe_id: 'a' }] })),
  budget,
  products,
})
const products = [pick('rice', '1', '1', '2'), pick('chicken_breast', '3', '3', '4')]
const rows = [
  // Rice: 1 kg packs. Disco and Géant share sku 1 but not its price.
  row({ store_key: 'disco', store_sku: '1', price: 60 }),
  row({ store_key: 'geant', store_sku: '1', price: 70, checked_at: '2026-10-16T21:00:00Z' }),
  row({ store_key: 'tata', store_sku: '2', base_qty: 500, price: 30 }),
  // Chicken: a GDU weighable 250 g piece at 400/kg, a Ta-Ta 1 kg tray at 380.
  row({ store_key: 'disco', store_sku: '3', size_source: 'unit', size_qty: 250, size_unit: 'g', price: 400 }),
  row({ store_key: 'geant', store_sku: '3', size_source: 'unit', size_qty: 250, size_unit: 'g', price: 400 }),
  row({ store_key: 'tata', store_sku: '4', size_source: 'unit', size_qty: 1, size_unit: 'kg', price: 380 }),
]

test('whole units of sale: 600 g of chicken is three 250 g pieces, or one 1 kg tray', () => {
  const p = pricing(menu(null, products), {}, rows)
  assert.deepEqual(lineOf({ id: 'chicken_breast', amount: 600 }, p.prices.chicken_breast!.disco!), { packs: 3, cost: 300 })
  assert.deepEqual(lineOf({ id: 'chicken_breast', amount: 600 }, p.prices.chicken_breast!.tata!), { packs: 1, cost: 380 })
  assert.deepEqual(
    p.plan.perStore.map((s) => [s.store, s.total]),
    [['disco', 360], ['geant', 370], ['tata', 440]],
  )
  assert.equal(p.base?.stores[0], 'disco')
  assert.equal(p.status, 'ok')
})

test('the plan is the store rule on the picked products', () => {
  const p = pricing(menu(500, products), {}, rows)
  assert.deepEqual(p.plan, planStores(p.needs, p.prices))
})

test('crossed-out or forged marks: what is left to buy, never NaN', () => {
  const items = pricing(menu(null, products), {}, rows).items
  const have = { rice: null, chicken_breast: 'x' } as unknown as Have
  assert.deepEqual(needsFor(items, have), [{ id: 'chicken_breast', amount: 600 }])
  const crossed = pricing(menu(null, products), { rice: null }, rows)
  assert.deepEqual(crossed.plan.perStore.map((s) => s.total), [300, 300, 380])
})

test('budget: equal fits, one peso less is over by one', () => {
  assert.equal(pricing(menu(360, products), {}, rows).over, 0)
  assert.equal(pricing(menu(359, products), {}, rows).over, 1)
  assert.equal(pricing(menu(null, products), {}, rows).over, null)
})

test('over at one store, but the offered split fits', () => {
  // x is cheap at disco only, y at tata only: a split saves more than 10%.
  const m: MenuData = { ...menu(2000, [pick('rice', '1', null, '2'), pick('chicken_breast', '3', null, '4')]) }
  const r = [
    row({ store_key: 'disco', store_sku: '1', price: 100 }),
    row({ store_key: 'tata', store_sku: '2', base_qty: 1000, price: 1000 }),
    row({ store_key: 'disco', store_sku: '3', base_qty: 1000, price: 2000 }),
    row({ store_key: 'tata', store_sku: '4', base_qty: 1000, price: 1100 }),
  ]
  const p = pricing(m, {}, r)
  assert.equal(p.plan.single?.total, 2100)
  assert.equal(p.plan.split?.total, 1200)
  assert.equal(p.over, 100)
  assert.equal(p.splitFits, true)
})

test('a menu saved before products, or with nothing priced', () => {
  assert.equal(pricing(menu(null), {}, rows).status, 'old')
  assert.equal(pricing(menu(null, products), {}, []).status, 'none')
})

test('checked date is the oldest of the products used', () => {
  assert.equal(pricing(menu(null, products), {}, rows).checkedAt, '2026-10-16T21:00:00Z')
})

test('the verdict says the cheapest option, the stores, the budget and what to swap', () => {
  assert.equal(
    verdict(pricing(menu(400, products), {}, rows)),
    'Cheapest: all at disco $360. Per store: disco $360, geant $370, tata $440. Budget $400: fits, $40 left.',
  )
  const over = verdict(pricing(menu(300, products), {}, rows))
  assert.equal(
    over,
    'Cheapest: all at disco $360. Per store: disco $360, geant $370, tata $440. Budget $300: over by $60. Costliest: chicken_breast $300, rice $60.',
  )
  assert.deepEqual(costliest(pricing(menu(300, products), {}, rows), 1), ['chicken_breast $300'])
  assert.match(verdict(pricing(menu(null), {}, rows)), /^Not priced: this menu has no products/)
  assert.ok(over.length < 700)
})
