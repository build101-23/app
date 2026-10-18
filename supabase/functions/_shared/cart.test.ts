import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cartFor, tataCartUrl } from './cart.ts'
import { itemId } from './list.ts'
import { days, type MenuData, type ProductPick } from './menu.ts'
import { pricing } from './offers.ts'
import { row } from './testing.ts'

// Two days of rice, chicken, garlic, brown rice (an 'other' food that picked the same Ta-Ta pack as the rice) and
// quinoa (no store sells it).
const integral = 'Arroz integral'
const quinoa = 'Quinoa roja'
const menu: MenuData = {
  recipes: [
    {
      id: 'a',
      name: 'Pollo con arroz',
      how: 'Al horno.',
      ingredients: [
        { food: 'rice', other_name: null, amount: 300, unit: 'g' },
        { food: 'chicken_breast', other_name: null, amount: 300, unit: 'g' },
        { food: 'garlic', other_name: null, amount: 10, unit: 'g' },
        { food: 'other', other_name: integral, amount: 100, unit: 'g' },
        { food: 'other', other_name: quinoa, amount: 50, unit: 'g' },
      ],
    },
  ],
  days: days.slice(5).map((day) => ({ day, meals: [{ slot: 'Cena', recipe_id: 'a' }] })),
  budget: null,
  products: [
    { food: 'rice', other_name: null, unit: 'g', disco: '1', geant: '1', tata: '2' },
    { food: 'chicken_breast', other_name: null, unit: 'g', disco: '3', geant: '3', tata: '4' },
    { food: 'garlic', other_name: null, unit: 'g', disco: '5', geant: '5', tata: null },
    { food: 'other', other_name: integral, unit: 'g', disco: '6', geant: null, tata: '2' },
    { food: 'other', other_name: quinoa, unit: 'g', disco: null, geant: null, tata: null },
  ] satisfies ProductPick[],
}
const rows = [
  row({ store_key: 'disco', store_sku: '1', price: 60 }),
  row({ store_key: 'geant', store_sku: '1', price: 70 }),
  row({ store_key: 'tata', store_sku: '2', base_qty: 500, price: 30, name: 'Arroz 500 g' }),
  // Chicken: a GDU weighable 250 g piece at 400/kg, a Ta-Ta 1 kg tray at 380 (ADR 0023).
  row({ store_key: 'disco', store_sku: '3', size_source: 'unit', size_qty: 250, size_unit: 'g', price: 400 }),
  row({ store_key: 'geant', store_sku: '3', size_source: 'unit', size_qty: 250, size_unit: 'g', price: 400 }),
  row({ store_key: 'tata', store_sku: '4', size_source: 'unit', size_qty: 1, size_unit: 'kg', price: 380, name: 'Pollo bandeja' }),
  row({ store_key: 'disco', store_sku: '5', base_qty: 250, price: 50 }),
  row({ store_key: 'geant', store_sku: '5', base_qty: 250, price: 55 }),
  row({ store_key: 'disco', store_sku: '6', price: 80 }),
]
const ids = (p: ReturnType<typeof pricing>) => p.needs.map((need) => need.id)

test('a store\'s cart: its products for what is left to buy, weighed food left out where the cart can\'t take it', () => {
  const p = pricing(menu, {}, rows)
  const disco = cartFor(p, 'disco', ids(p))
  assert.deepEqual(
    disco.lines.map((line) => [line.sku, line.qty, line.cost]),
    [['1', 1, 60], ['5', 1, 50], ['6', 1, 80]],
  )
  assert.deepEqual(disco.skipped, [
    { id: 'chicken_breast', reason: 'weighed' },
    { id: itemId('other', quinoa, 'g'), reason: 'not_found' },
  ])
  assert.equal(disco.total, 190)
  assert.equal(disco.lines[0].url, 'https://www.example.uy/p/1')
})

test('the whole list at Ta-Ta: one line per product, Ta-Ta takes weighed food, and says what stays out', () => {
  const p = pricing(menu, {}, rows)
  const tata = cartFor(p, 'tata', ids(p))
  // 600 g of rice is 2 × 500 g, plus 1 for the brown rice that picked the same pack.
  assert.deepEqual(
    tata.lines.map((line) => [line.sku, line.qty, line.cost, line.name]),
    [['2', 3, 90, 'Arroz 500 g'], ['4', 1, 380, 'Pollo bandeja']],
  )
  assert.deepEqual(tata.skipped, [
    { id: 'garlic', reason: 'not_here' },
    { id: itemId('other', quinoa, 'g'), reason: 'not_found' },
  ])
  assert.equal(tata.total, 470)
})

test('crossed-out items get no line, and partly-had ones only what is left', () => {
  const crossed = pricing(menu, { rice: null }, rows)
  assert.deepEqual(cartFor(crossed, 'tata', ids(crossed)).lines.map((line) => [line.sku, line.qty]), [['4', 1], ['2', 1]])
  // 200 g at home leaves 400 g of rice: one 500 g pack, plus the brown rice's.
  const partly = pricing(menu, { rice: 200 }, rows)
  assert.deepEqual(cartFor(partly, 'tata', ids(partly)).lines[0].qty, 2)
})

test('the Ta-Ta link: sku, qty and seller per line, the sales channel once', () => {
  const p = pricing(menu, {}, rows)
  assert.equal(
    tataCartUrl(cartFor(p, 'tata', ids(p)).lines),
    'https://secure.tata.com.uy/checkout/cart/add?sku=2&qty=3&seller=1&sku=4&qty=1&seller=1&sc=4',
  )
})
