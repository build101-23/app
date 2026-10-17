import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addMacros, nutrition, nutritionText } from './nutrition.ts'

test('kcal roughly match the macros, catching typos in the table', () => {
  for (const [food, [kcal, protein, carbs, fat]] of Object.entries(nutrition)) {
    const fromMacros = 4 * protein + 4 * carbs + 9 * fat
    // Fiber and rounding: legumes and oats land up to ~15% above the macros alone.
    assert.ok(Math.abs(kcal - fromMacros) <= Math.max(10, kcal * 0.2), `${food}: ${kcal} kcal vs ${fromMacros}`)
  }
})

test('adds grams per 100 and units per unit, and names what it leaves out', () => {
  const total = addMacros([
    { food: 'chicken_breast', other_name: null, amount: 150, unit: 'g' },
    { food: 'egg', other_name: null, amount: 2, unit: 'un' },
    { food: 'other', other_name: 'Espinaca', amount: 50, unit: 'g' },
  ])
  assert.equal(total.kcal, 120 * 1.5 + 72 * 2)
  assert.equal(total.protein, 22.5 * 1.5 + 6.3 * 2)
  assert.deepEqual(total.missing, ['Espinaca'])
})

test('describes a food per its unit', () => {
  assert.equal(nutritionText('egg'), 'per unit: 72 kcal, 6.3 g protein, 0.4 g carbs, 4.8 g fat')
  assert.equal(nutritionText('milk'), 'per 100 ml: 60 kcal, 3.1 g protein, 4.8 g carbs, 3 g fat')
})
