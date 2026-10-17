// ⚠️ Tests the temporary example prices. Delete with prices.ts per ADR 0019.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { catalog, type CatalogKey } from './catalog.ts'
import { examplePrices } from './prices.ts'
import { planStores, stores } from './stores.ts'

const rows = Object.entries(examplePrices) as [CatalogKey, NonNullable<(typeof examplePrices)[string]>][]

test('every price is a whole number of pesos above the $1 placeholder', () => {
  for (const [food, row] of rows) {
    for (const offer of Object.values(row)) assert.ok(Number.isInteger(offer.price) && offer.price > 1, food)
  }
})

test('only g and ml foods are sold by weight; every food at two stores or more, every store lacks one', () => {
  for (const [food, row] of rows) {
    for (const offer of Object.values(row)) assert.equal(offer.by_weight, catalog[food].unit !== 'un' && catalog[food].pack === null, food)
    assert.ok(Object.keys(row).length >= 2, food)
  }
  for (const store of stores) assert.ok(rows.some(([, row]) => !row[store]), store)
})

test('a week with each store\'s missing food has no single store and does have a split', () => {
  const week = [{ id: 'ricotta', amount: 500 }, { id: 'tart_crust', amount: 2 }, { id: 'chard', amount: 500 }]
  const plan = planStores(week, examplePrices)
  assert.equal(plan.single, null)
  assert.notEqual(plan.split, null)
})
