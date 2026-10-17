import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cost, planStores, type Need, type Prices } from './stores.ts'

// One-unit packs, so a price is the item's cost. Rows are item ids, columns stores.
const prices = (rows: Record<string, { disco?: number; geant?: number; tata?: number }>): Prices =>
  Object.fromEntries(
    Object.entries(rows).map(([id, row]) => [
      id,
      Object.fromEntries(Object.entries(row).map(([store, price]) => [store, { price, base_qty: 1 }])),
    ]),
  )
const needs = (...ids: string[]): Need[] => ids.map((id) => ({ id, amount: 1 }))

test('costs whole packs, or the exact weight for loose food, in whole pesos', () => {
  assert.equal(cost(700, { price: 200, base_qty: 1000 }), 200)
  assert.equal(cost(700, { price: 120, base_qty: 500 }), 240)
  assert.equal(cost(700, { price: 230, base_qty: 1000, by_weight: true }), 161)
  assert.equal(cost(600, { price: 89, base_qty: 1000, by_weight: true }), 53)
  assert.equal(cost(10, { price: 150, base_qty: 12 }), 150)
  assert.equal(cost(1000, { price: 60, base_qty: 1000 }), 60)
  assert.equal(cost(0.1 + 0.2, { price: 10, base_qty: 0.3 }), 10) // a float sum doesn't add a pack
  assert.equal(cost(700, { price: 49.9, base_qty: 500 }), 100)
})

test('nothing to price: no recommendation', () => {
  const empty = planStores([], prices({ x: { disco: 1 } }))
  assert.deepEqual([empty.single, empty.split, empty.notFound], [null, null, []])
  const other = planStores(needs('other:g:queso'), prices({ x: { disco: 1 } }))
  assert.deepEqual([other.single, other.split, other.notFound], [null, null, ['other:g:queso']])
})

test('one store by default: the cheapest with the whole list, and its saving against the average', () => {
  const plan = planStores(needs('x', 'y'), prices({ x: { disco: 11, geant: 10, tata: 12 }, y: { disco: 11, geant: 10, tata: 12 } }))
  assert.deepEqual([plan.single?.stores, plan.single?.total, plan.single?.saving, plan.split], [['geant'], 20, 2, null])
  assert.deepEqual(plan.single?.at, { x: 'geant', y: 'geant' })
  assert.deepEqual(plan.perStore.map((s) => s.total), [22, 20, 24])
})

test('a split needs to save at least 10% of the one-store total', () => {
  const rows = (x: number) => prices({ x: { disco: 50, geant: x, tata: 60 }, y: { disco: 50, geant: 60, tata: 60 } })
  const tenPercent = planStores(needs('x', 'y'), rows(40))
  assert.deepEqual([tenPercent.single?.total, tenPercent.split?.stores, tenPercent.split?.total], [100, ['disco', 'geant'], 90])
  assert.deepEqual(tenPercent.split?.at, { x: 'geant', y: 'disco' })
  assert.equal(planStores(needs('x', 'y'), rows(41)).split, null)
  assert.equal(planStores(needs('x', 'y'), rows(45)).split, null)
})

test('no single store has the whole list: the split is the recommendation', () => {
  const plan = planStores(needs('x', 'y', 'z'), prices({ x: { disco: 10, tata: 9 }, y: { disco: 10, geant: 12 }, z: { geant: 10 } }))
  assert.equal(plan.single, null)
  assert.deepEqual([plan.split?.stores, plan.split?.total], [['disco', 'geant'], 30])
  assert.deepEqual(plan.perStore.map((s) => s.missing), [1, 1, 2])
})

test('a cheaper store missing items is never the one store, and shows how many it misses', () => {
  const plan = planStores(needs('x', 'y'), prices({ x: { disco: 80, geant: 30 }, y: { disco: 20 } }))
  assert.deepEqual([plan.single?.stores, plan.single?.total], [['disco'], 100])
  assert.deepEqual(plan.perStore[1], { store: 'geant', total: 30, missing: 1 })
  assert.deepEqual([plan.split?.stores, plan.split?.total], [['disco', 'geant'], 50])
})

test('no store and no pair has the whole list: no recommendation, never three stores', () => {
  const plan = planStores(needs('x', 'y', 'z'), prices({ x: { disco: 10 }, y: { geant: 20 }, z: { tata: 30 } }))
  assert.deepEqual([plan.single, plan.split], [null, null])
  assert.deepEqual(plan.perStore.map((s) => s.missing), [2, 2, 2])
})

test('items no store sells are not found online and out of every total', () => {
  const plan = planStores(needs('x', 'w', 'other:g:queso'), prices({ x: { disco: 10, geant: 11, tata: 12 }, w: {} }))
  assert.deepEqual(plan.notFound, ['w', 'other:g:queso'])
  assert.deepEqual(plan.perStore.map((s) => [s.total, s.missing]), [[10, 0], [11, 0], [12, 0]])
  assert.equal(plan.single?.saving, 1)
})

test('two different other items are both not found online, in list order', () => {
  const plan = planStores(needs('x', 'other:g:queso', 'other:un:palta'), prices({ x: { disco: 10 } }))
  assert.deepEqual([plan.single?.total, plan.notFound], [10, ['other:g:queso', 'other:un:palta']])
})

test('ties go to the earlier store, and a pair that buys everything at one store is no split', () => {
  const tie = planStores(needs('x', 'y'), prices({ x: { disco: 10, geant: 10, tata: 10 }, y: { disco: 10, geant: 10, tata: 10 } }))
  assert.deepEqual([tie.single?.stores, tie.split], [['disco'], null])
  const pairs = planStores(needs('x', 'y'), prices({ x: { disco: 10, geant: 20, tata: 20 }, y: { disco: 20, geant: 10, tata: 10 } }))
  assert.deepEqual(pairs.split?.stores, ['disco', 'geant'])
})

test('tied pairs go to the first pair in order', () => {
  const plan = planStores(needs('x', 'y'), prices({ x: { disco: 10, geant: 10, tata: 5 }, y: { disco: 20, geant: 20, tata: 30 } }))
  assert.deepEqual([plan.single?.stores, plan.single?.total], [['disco'], 30])
  assert.deepEqual([plan.split?.stores, plan.split?.total, plan.split?.at], [['disco', 'tata'], 25, { x: 'tata', y: 'disco' }])
})

test('the average counts each item over the stores that sell it; the saving rounds down and can be negative', () => {
  const partial = planStores(needs('x', 'y'), prices({ x: { disco: 10, geant: 20, tata: 30 }, y: { disco: 10 } }))
  assert.equal(partial.single?.saving, 10)
  const negative = planStores(needs('x', 'y'), prices({ x: { disco: 40, geant: 10, tata: 10 }, y: { disco: 10 } }))
  assert.deepEqual([negative.single?.saving, negative.split?.total, negative.split?.saving], [-20, 20, 10])
  assert.equal(planStores(needs('x'), prices({ x: { disco: 10, geant: 11 } })).single?.saving, 0)
})

test('the saving is exact and does not depend on list order', () => {
  const p = prices({ x: { disco: 1, geant: 1, tata: 2 }, y: { disco: 16, geant: 16, tata: 17 }, z: { disco: 7, geant: 7, tata: 8 } })
  for (const list of [needs('x', 'y', 'z'), needs('z', 'y', 'x')]) {
    const plan = planStores(list, p)
    assert.deepEqual([plan.single?.stores, plan.single?.total, plan.single?.saving], [['disco'], 24, 1])
  }
})

test('a split that saves nothing is not offered, even on a free list', () => {
  const plan = planStores(needs('x', 'y'), prices({ x: { disco: 0, geant: 0 }, y: { disco: 0, tata: 0 } }))
  assert.equal(plan.split, null)
})

test('a bigger pack wins only if it is cheaper even counting the leftover', () => {
  const rice = (bag: number): Prices => ({ rice: { disco: { price: bag, base_qty: 5000 }, geant: { price: 60, base_qty: 1000 } } })
  const loses = planStores([{ id: 'rice', amount: 1200 }], rice(249))
  assert.deepEqual([loses.single?.stores, loses.single?.total, loses.perStore[0].total], [['geant'], 120, 249])
  const wins = planStores([{ id: 'rice', amount: 1200 }], rice(100))
  assert.deepEqual([wins.single?.stores, wins.single?.total, wins.split], [['disco'], 100, null])
})
