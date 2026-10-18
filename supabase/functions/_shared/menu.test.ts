import { test } from 'node:test'
import assert from 'node:assert/strict'
import { days, menuProblems, menuShapeProblems, type MenuData } from './menu.ts'

const week = (): MenuData => ({
  recipes: [
    {
      id: 'r1',
      name: 'Pollo con arroz',
      how: 'Al horno.',
      ingredients: [
        { food: 'chicken_breast', other_name: null, amount: 150, unit: 'g' },
        { food: 'other', other_name: 'Orégano', amount: 1, unit: 'g' },
      ],
    },
  ],
  days: days.map((day) => ({ day, meals: [{ slot: 'Cena', recipe_id: 'r1' }] })),
})

test('a valid week has no problems', () => {
  assert.deepEqual(menuProblems(week()), [])
})

test('normalizes the case of food and day keys', () => {
  const menu = week()
  menu.recipes[0].ingredients[0].food = 'Chicken_Breast' as 'chicken_breast'
  menu.days[0].day = 'Monday' as 'monday'
  assert.deepEqual(menuProblems(menu), [])
  assert.equal(menu.recipes[0].ingredients[0].food, 'chicken_breast')
  assert.equal(menu.days[0].day, 'monday')
})

test('flags what strict mode lets through', () => {
  const menu = week()
  menu.recipes[0].ingredients = [
    { food: 'constructor' as 'egg', other_name: null, amount: 1, unit: 'un' },
    { food: 'egg', other_name: null, amount: 2, unit: 'g' },
    { food: 'other', other_name: ' ', amount: 0, unit: 'g' },
  ]
  menu.days[1] = { day: 'monday', meals: [{ slot: 'Cena', recipe_id: 'r9' }] }
  assert.deepEqual(menuProblems(menu), [
    'Recipe r1: constructor is not in the catalog.',
    'Recipe r1: egg is measured in un, not g.',
    "Recipe r1: an 'other' ingredient has no other_name.",
    'Recipe r1: other needs an amount above 0.',
    "monday: recipe r9 doesn't exist.",
    'Day 2 (monday) must come after monday: days go in order from the first one, sunday then monday, each once.',
  ])
})

test('a menu covers 1 to 7 days in calendar order from the first, each once', () => {
  const menu = week()
  const pick = (...names: string[]) => names.map((name) => week().days.find((entry) => entry.day === name)!)
  for (const run of [['saturday', 'sunday'], ['saturday', 'sunday', 'monday'], ['monday', 'wednesday', 'friday']]) {
    menu.days = pick(...run)
    assert.deepEqual(menuProblems(menu), [])
  }
  menu.days = pick('monday', 'wednesday', 'tuesday')
  assert.deepEqual(menuProblems(menu), [
    'Day 3 (tuesday) must come after wednesday: days go in order from the first one, sunday then monday, each once.',
  ])
  menu.days = [...week().days, ...pick('monday')]
  assert.deepEqual(menuProblems(menu), [
    'Day 8 (monday) must come after sunday: days go in order from the first one, sunday then monday, each once.',
  ])
  menu.days = []
  assert.deepEqual(menuProblems(menu), ['The menu needs at least one day.'])
})

test('checks the budget and the picked products', () => {
  const menu = week()
  menu.budget = 0
  menu.products = [{ food: 'egg', other_name: null, unit: 'g', disco: '1', geant: null, tata: null }]
  assert.deepEqual(menuProblems(menu), ['budget must be null or above 0.', 'Product 1: egg is measured in un, not g.'])
})

test('checks the shape that strict mode used to guarantee', () => {
  assert.deepEqual(menuShapeProblems(week()), [])
  assert.deepEqual(menuShapeProblems({ ...week(), budget: 1500, products: [] }), [])
  assert.deepEqual(menuShapeProblems('menu'), ['The menu must be an object with recipes, days, budget and products.'])
  assert.deepEqual(
    menuShapeProblems({
      recipes: [{ id: 'r1', name: 'x', how: 'y', ingredients: [{ food: 'egg', amount: '2', unit: 'un' }] }],
      days: [{ day: 'Funday', meals: [] }],
      budget: '1500',
      products: [{ food: 'egg', other_name: null, unit: 'un', disco: 1 }],
    }),
    [
      'Recipe 1, ingredient 1: needs food (text), other_name (text or null), amount (number) and unit (g, ml or un).',
      'Day 1: needs day (monday to sunday) and meals, each with slot and recipe_id.',
      'budget must be a number or null.',
      'Product 1: needs food, other_name, unit, and disco, geant and tata (a sku or null).',
    ],
  )
})
