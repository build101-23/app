import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextOrder } from './repeat.ts'

test('the next order is a full interval after the day it was set', () => {
  assert.equal(nextOrder('2026-10-18', 7, '2026-10-18'), '2026-10-25')
  assert.equal(nextOrder('2026-10-18', 4, '2026-10-18'), '2026-10-22')
})

test('an order day is today, and the day after it the next one is an interval later', () => {
  assert.equal(nextOrder('2026-10-18', 7, '2026-10-25'), '2026-10-25')
  assert.equal(nextOrder('2026-10-18', 7, '2026-10-26'), '2026-11-01')
})

test('keeps counting across months and long gaps', () => {
  assert.equal(nextOrder('2026-10-30', 3, '2026-11-01'), '2026-11-02')
  assert.equal(nextOrder('2026-10-18', 7, '2027-01-01'), '2027-01-03')
})
