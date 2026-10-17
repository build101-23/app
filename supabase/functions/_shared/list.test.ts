import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildList, left, stepHave, toBuy, type Item } from './list.ts'
import { days, type MenuData } from './menu.ts'

const weekdays = days.slice(0, 5)
const menu: MenuData = {
  recipes: [
    {
      id: 'a',
      name: 'Pollo con arroz',
      how: 'Al horno.',
      ingredients: [
        { food: 'chicken_breast', other_name: null, amount: 100, unit: 'g' },
        { food: 'rice', other_name: null, amount: 110, unit: 'g' },
        { food: 'egg', other_name: null, amount: 0.7, unit: 'un' },
        { food: 'other', other_name: 'Queso rallado', amount: 10, unit: 'g' },
      ],
    },
    {
      id: 'b',
      name: 'Pollo a la plancha',
      how: 'A la plancha.',
      ingredients: [
        { food: 'chicken_breast', other_name: null, amount: 75, unit: 'g' },
        { food: 'other', other_name: ' queso rallado ', amount: 5, unit: 'g' },
        // A key the catalog doesn't have (it was removed after this menu was saved).
        { food: 'quinoa' as 'egg', other_name: null, amount: 50, unit: 'g' },
      ],
    },
    { id: 'unused', name: 'Lentejas', how: 'Guisadas.', ingredients: [{ food: 'lentils', other_name: null, amount: 80, unit: 'g' }] },
  ],
  days: days.map((day) => ({
    day,
    meals: weekdays.includes(day)
      ? [{ slot: 'Almuerzo', recipe_id: 'a' }, { slot: 'Cena', recipe_id: 'a' }]
      : [{ slot: 'Cena', recipe_id: 'b' }],
  })),
}

const list = buildList(menu)
const find = (id: string) => list.find((item) => item.id === id)!

test('adds up every serving of the week', () => {
  assert.deepEqual(
    list.map((item) => [item.id, item.amount]),
    [
      ['chicken_breast', 1150],
      ['rice', 1100],
      ['egg', 7], // 0.7 × 10 is 7.000000000000001 before rounding
      ['other:g:queso rallado', 110],
      ['other:g:quinoa', 100],
    ],
  )
  assert.equal(find('chicken_breast').section, 'meat')
  assert.equal(find('rice').pack, 1000)
})

test('merges other foods by name and lists unknown keys as other', () => {
  assert.equal(find('other:g:queso rallado').other_name, 'Queso rallado')
  assert.deepEqual(
    { ...find('other:g:quinoa') },
    { id: 'other:g:quinoa', food: 'other', other_name: 'quinoa', section: 'other', unit: 'g', amount: 100, pack: null },
  )
})

test('rounds up to packs, units or 100 g, never down', () => {
  assert.equal(toBuy(find('rice'), {}), 2000)
  assert.equal(toBuy(find('chicken_breast'), {}), 1200)
  assert.equal(toBuy(find('egg'), {}), 12)
  const garlic: Item = { id: 'garlic', food: 'garlic', other_name: null, section: 'produce', unit: 'g', amount: 35, pack: null }
  assert.equal(toBuy(garlic, {}), 40)
})

test('subtracts what the user has at home', () => {
  const rice = find('rice')
  assert.equal(left(rice, { rice: 500 }), 600)
  assert.equal(toBuy(rice, { rice: 500 }), 1000)
  assert.equal(left(rice, { rice: null }), 0)
  assert.equal(toBuy(rice, { rice: 5000 }), 0)
  assert.equal(left(rice, { egg: null }), 1100)
})

test('steps what to buy down to crossed out and back up to the menu', () => {
  const rice = find('rice')
  let have = stepHave(rice, {}, -1)
  assert.deepEqual(have, { rice: 100 })
  assert.equal(toBuy(rice, have), 1000)
  have = stepHave(rice, have, -1)
  assert.deepEqual(have, { rice: null })
  have = stepHave(rice, have, 1)
  assert.equal(toBuy(rice, have), 1000)
  assert.deepEqual(stepHave(rice, have, 1), {})

  const chicken = find('chicken_breast')
  assert.deepEqual(stepHave(chicken, { rice: null }, -1), { rice: null, chicken_breast: 50 })
})
