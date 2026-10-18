// A recurring order (ADR 0039): the menu's shopping repeats every `every` days from `from`, the day it was set.
// Plain TS shared by the chat function and the web app. Dates are YYYY-MM-DD, today's in Montevideo, from the caller.

export const MAX_REPEAT_DAYS = 28

const DAY_MS = 24 * 60 * 60 * 1000
const toDays = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS
const toDate = (days: number) => new Date(days * DAY_MS).toISOString().slice(0, 10)

// The next order: the first from + k × every on or after today, k ≥ 1. On the day it's set, `every` days later.
export function nextOrder(from: string, every: number, today: string): string {
  const k = Math.max(1, Math.ceil((toDays(today) - toDays(from)) / every))
  return toDate(toDays(from) + k * every)
}

// Today in Montevideo (the app's only city), as YYYY-MM-DD.
export const todayInMontevideo = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Montevideo' })
