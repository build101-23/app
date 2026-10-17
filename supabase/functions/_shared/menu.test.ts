import { test } from 'node:test'
import assert from 'node:assert/strict'
import { days, menuProblems, type MenuData } from './menu.ts'

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
    'monday must appear exactly once.',
    'tuesday must appear exactly once.',
  ])
})
