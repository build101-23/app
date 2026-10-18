import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Unit } from '../supabase/functions/_shared/catalog.ts'
import { buildList, stepHave, toBuy, type Have, type Item } from '../supabase/functions/_shared/list.ts'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { lineOf, pricing, type Pricing } from '../supabase/functions/_shared/offers.ts'
import { stores, type Option, type StoreKey, type StorePlan } from '../supabase/functions/_shared/stores.ts'
import Order from './Order'
import { money, nameOf } from './format'
import { usePrices } from './prices'
import { supabase } from './supabase'
import { t } from './strings'
import { Alert, ChevronIcon, EmptyState, ListIcon, PageSkeleton, StoreIcon } from './ui'

// updated_at is the menu's version: writing have doesn't touch it.
export type MenuRow = { data: MenuData; have: Have; updated_at: string }

const sections = Object.keys(t.list.sections) as (keyof typeof t.list.sections)[]

// Saves and loads run one after another, so quick taps land in order and a remounted tab reads after them.
let queue: Promise<unknown> = Promise.resolve()
function inTurn<T>(task: () => PromiseLike<T>): Promise<T> {
  const run = queue.then(task)
  queue = run.catch(() => {})
  return run
}
// Counts saves, so a load can tell that a tap came in while it was reading.
let saves = 0

// Rounds up, so a line never reads as less than the menu needs.
const num = (n: number) => n.toLocaleString('es-UY', { maximumFractionDigits: 2, roundingMode: 'ceil' })
// 1500 g reads as 1,5 kg.
function qty(amount: number, unit: Unit) {
  if (unit !== 'un' && amount >= 1000) return `${num(amount / 1000)} ${unit === 'g' ? t.menu.units.kg : t.menu.units.l}`
  return `${num(amount)} ${t.menu.units[unit]}`
}
// Whole packs where the food comes in packs ("2 × 1 kg"), otherwise the amount.
const buyText = (item: Item, buy: number) =>
  item.pack ? `${buy / item.pack} × ${qty(item.pack, item.unit)}` : qty(buy, item.unit)

// What's left to buy, by section: what Share and Copy send, and the chat's card shows.
const listText = (items: Item[], have: Have) =>
  [
    t.list.title,
    ...sections.flatMap((section) => {
      const lines = items
        .filter((item) => item.section === section && toBuy(item, have) > 0)
        .map((item) => `- ${nameOf(item)}: ${buyText(item, toBuy(item, have))}`)
      return lines.length ? ['', t.list.sections[section], ...lines] : []
    }),
  ].join('\n')

const day = (iso: string) => new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })
// The chosen total over the menu's days, on what's left to buy like the total. A one-day menu's total already is that.
const perDay = (total: number, days: number) => (days > 1 ? t.prices.perDay(money(total / days), days) : '')

// The store the List tab shows, picked for this menu version (ADR 0034). Another menu opens on the recommended one.
// shortcut: the pick lives in this browser; move it next to menus.have if people switch devices
function readTab(version: string): StoreKey | null {
  try {
    const saved = JSON.parse(localStorage.getItem('storeTab') ?? 'null')
    return saved?.version === version && stores.includes(saved.store) ? saved.store : null
  } catch {
    return null
  }
}

// The store the List tab opens on: the store rule's one store, else the one missing the fewest items, then the
// cheapest.
const bestStore = (plan: StorePlan): StoreKey =>
  plan.single?.stores[0] ?? [...plan.perStore].sort((a, b) => a.missing - b.missing || a.total - b.total)[0].store

// A total against the menu's budget (ADR 0024). The chat's card adds a hint when one store is over but the split fits.
function budgetText(p: Pricing, total: number | null, splitHint: Option | null = null) {
  if (p.budget == null || total == null) return null
  const over = total - p.budget
  if (over <= 0) return { alert: false, text: t.prices.budgetFits(money(p.budget), money(-over)) }
  const hint = splitHint ? ` ${t.prices.splitFits(t.stores[splitHint.stores[0]], t.stores[splitHint.stores[1]])}` : ''
  return { alert: true, text: `${t.prices.budgetOver(money(p.budget), money(over))}${hint}` }
}

// Why there's no total yet: still reading, the read failed, a menu saved before real products, or nothing priced.
function noPrices(rows: unknown, p: Pricing | undefined) {
  if (rows === undefined) return t.prices.loading
  if (!p) return t.prices.loadError
  return p.status === 'old' ? t.prices.oldMenu : p.status === 'none' ? t.prices.none : ''
}

// The list as it stands, with its total: the chat's card under a list tool call. Live, like the List tab. The price
// comes first; the items are in the tab, so the card only says how many are left in each section.
export function ListPreview({ row, busy, onOpen }: { row: MenuRow; busy: boolean; onOpen: () => void }) {
  const rows = usePrices(row.data)
  const p = rows ? pricing(row.data, row.have, rows) : undefined
  const left = buildList(row.data).filter((item) => toBuy(item, row.have) > 0)
  const counts = sections
    .map((section) => [section, left.filter((item) => item.section === section).length] as const)
    .filter(([, n]) => n > 0)
  const waiting = noPrices(rows, p)
  let price = null
  let note = null
  if (p && !waiting) {
    const { single, split, notFound } = p.plan
    const chosen = single || split
    const budget = budgetText(p, chosen?.total ?? null, p.splitFits && chosen === single ? split : null)
    const daily = chosen ? perDay(chosen.total, row.data.days.length) : ''
    price = (
      <div className="price">
        {chosen ? (
          <div className="total">
            <span className="stores">
              {chosen.stores.map((store) => (
                <StoreIcon key={store} store={store} />
              ))}
            </span>
            <div>
              <strong>{money(chosen.total)}</strong>
              <span>
                {single
                  ? t.chat.listCard.allAt(t.stores[chosen.stores[0]])
                  : t.chat.listCard.splitAt(t.stores[chosen.stores[0]], t.stores[chosen.stores[1]])}
              </span>
              {!single && <small className="muted">{t.prices.noOneStore}</small>}
              {daily && <small className="muted">{daily}</small>}
            </div>
          </div>
        ) : (
          <div>
            <p>{t.prices.noOneStore}</p>
            <small className="muted">
              {p.plan.perStore.map(({ store, total }) => `${t.stores[store]} ${money(total)}`).join(' · ')}
            </small>
          </div>
        )}
        {budget && <p>{budget.text}</p>}
      </div>
    )
    if (notFound.length > 0 || p.checkedAt)
      note = (
        <p className="note muted">
          {notFound.length > 0 && <small>{t.prices.missing(notFound.length)}</small>}
          {p.checkedAt && <small>{t.prices.checked(day(p.checkedAt))}</small>}
        </p>
      )
  }
  return (
    <section className="list-card" aria-label={t.chat.listCard.title}>
      <header>
        <span className="badge">
          <ListIcon />
        </span>
        <strong>{t.chat.listCard.title}</strong>
        {left.length > 0 && <span className="pill">{t.chat.listCard.count(left.length)}</span>}
      </header>
      {left.length === 0 ? (
        <p className="empty">{t.list.nothingLeft}</p>
      ) : (
        <>
          {price ?? <p className="muted wait">{waiting}</p>}
          <ul>
            {counts.map(([section, n]) => (
              <li key={section}>
                <span>{t.list.sections[section]}</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
          {note}
        </>
      )}
      <button type="button" className="button secondary" disabled={busy} onClick={onOpen}>
        {t.chat.openList}
        <ChevronIcon />
      </button>
    </section>
  )
}

export default function List({ session, onOpenChat }: { session: Session; onOpenChat: () => void }) {
  // undefined while loading, null when the AI hasn't saved a menu yet.
  const [menu, setMenu] = useState<MenuRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [picked, setPicked] = useState<{ version: string; store: StoreKey } | null>(null)
  const rows = usePrices(menu?.data)

  // Reads again whenever the app comes back to the screen, so marks saved from the chat or another device
  // show up before the next tap writes the whole map over them.
  useEffect(() => {
    const load = () => {
      const before = saves
      return inTurn(() => supabase.from('menus').select('data, have, updated_at').maybeSingle()).then(
        ({ data, error }) => {
          if (error) setError(t.menu.loadError)
          // A tap made while this read was in flight is newer than the `have` it read, and that save writes it.
          else setMenu((m) => (saves !== before && m && data ? { ...data, have: m.have } : data))
        },
      )
    }
    const onVisible = () => document.visibilityState === 'visible' && load()
    load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  if (menu === undefined) {
    return <div className="page list">{error ? <Alert text={error} /> : <PageSkeleton label={t.list.loading} shape="list" />}</div>
  }
  if (!menu) {
    return (
      <div className="page list">
        <EmptyState text={t.menu.empty} action={t.profile.openChat} onAction={onOpenChat} />
      </div>
    )
  }

  const { have, updated_at } = menu
  const items = buildList(menu.data)
  const text = listText(items, have)
  const nothingToBuy = items.every((item) => toBuy(item, have) === 0)

  // Priced on what's left to buy, unrounded; crossed-out items have nothing left.
  const p = rows ? pricing(menu.data, have, rows) : undefined
  const waiting = noPrices(rows, p)
  const priced = !!p && !waiting
  const plan = p?.plan
  // The store whose products and prices the list shows (ADR 0034).
  const tab: StoreKey | null = plan
    ? (picked?.version === updated_at ? picked.store : null) ?? readTab(updated_at) ?? bestStore(plan)
    : null
  const tabTotal = plan && tab ? plan.perStore.find((s) => s.store === tab)!.total : null
  const recommended = plan?.single?.stores[0] ?? null
  const budget = p && budgetText(p, tabTotal)
  const daily = tabTotal != null ? perDay(tabTotal, menu.data.days.length) : ''

  function pick(store: StoreKey) {
    try {
      localStorage.setItem('storeTab', JSON.stringify({ version: updated_at, store }))
    } catch {
      // Private mode: the pick only lasts while the tab is open.
    }
    setPicked({ version: updated_at, store })
  }

  // The screen changes at once. Each save sends the whole map, so the last one to land decides what's stored.
  function save(next: Have) {
    saves++
    setMenu((m) => m && { ...m, have: next })
    setNotice('')
    inTurn(async () => {
      const { error } = await supabase.from('menus').update({ have: next }).eq('user_id', session.user.id)
      setError(error ? t.list.saveError : '')
    })
  }

  function toggle(item: Item, crossed: boolean) {
    const next = { ...have }
    if (crossed) delete next[item.id]
    else next[item.id] = null
    save(next)
  }

  async function share() {
    // The share sheet has WhatsApp on phones; without one, open WhatsApp directly.
    if ('share' in navigator) await navigator.share({ text }).catch(() => {}) // a cancel rejects too
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
  }

  // Called straight from the tap: Safari refuses clipboard writes after an await.
  function copy() {
    setNotice('')
    navigator.clipboard.writeText(text).then(
      () => setNotice(t.list.copied),
      () => setError(t.list.copyError),
    )
  }

  return (
    <div className="page list">
      {!priced &&
        !nothingToBuy &&
        (rows === null ? (
          <Alert text={t.prices.loadError} />
        ) : (
          <section className="prices">
            <p className="muted">{waiting}</p>
          </section>
        ))}
      {priced && plan && tab && (
        <section className="stores">
          <h2 id="where" className="sr-only">
            {t.prices.where}
          </h2>
          <div className="store-tabs" role="group" aria-labelledby="where">
            {plan.perStore.map(({ store, total, missing }) => (
              <button key={store} type="button" className="store-tab" aria-pressed={store === tab} onClick={() => pick(store)}>
                <StoreIcon store={store} />
                <span className="store-tab-name">{t.stores[store]}</span>
                <span className="store-tab-total">{money(total)}</span>
                {store === recommended ? (
                  <span className="pill">{t.prices.cheapest}</span>
                ) : (
                  missing > 0 && <small className="muted">{t.prices.missing(missing)}</small>
                )}
              </button>
            ))}
          </div>
          {daily && <p>{daily}</p>}
          {budget && <p role={budget.alert ? 'alert' : undefined}>{budget.text}</p>}
          {tab === recommended && plan.single!.saving > 0 && (
            <section className="saving-card">
              <strong>{t.prices.saving.title(money(plan.single!.saving))}</strong>
              <span>{t.prices.saving.vsAverage}</span>
              {/* This menu repeated for 30 days, at today's prices: an estimate, and the note says so. */}
              <p>{t.prices.saving.perMonth(money(Math.round((plan.single!.saving * 30) / menu.data.days.length)))}</p>
              <small className="muted">{t.prices.saving.perMonthNote}</small>
            </section>
          )}
          {p?.checkedAt && <p className="muted">{t.prices.checked(day(p.checkedAt))}</p>}
        </section>
      )}
      <p className="muted">{t.list.hint}</p>
      <div className="list-actions">
        <button type="button" className="button secondary small" disabled={nothingToBuy} onClick={share}>
          {t.list.share}
        </button>
        <button type="button" className="button secondary small" disabled={nothingToBuy} onClick={copy}>
          {t.list.copy}
        </button>
        {Object.keys(have).length > 0 && (
          <button
            type="button"
            className="button secondary small"
            onClick={() => window.confirm(t.list.resetConfirm) && save({})}
          >
            {t.list.reset}
          </button>
        )}
        {/* The same size as its neighbors, at the right edge; the full one, with its notes, is under the list. */}
        {priced && p && tab && !nothingToBuy && <Order p={p} store={tab} compact />}
      </div>
      {/* Always mounted, so "Lista copiada." is announced when its text appears. */}
      <p className="muted" role="status">
        {notice}
      </p>
      {error && <Alert text={error} />}
      {sections.map((section) => {
        const inSection = items.filter((item) => item.section === section)
        if (!inSection.length) return null
        return (
          <section key={section}>
            <h2>{t.list.sections[section]}</h2>
            <ul className="rows">
              {inSection.map((item) => {
                const name = nameOf(item)
                const buy = toBuy(item, have)
                const crossed = buy === 0
                const needs = qty(item.amount, item.unit)
                const store = priced && tab ? tab : undefined
                const need = p?.needs.find((n) => n.id === item.id)
                // What to buy for this line at the selected store, and its link.
                const offer = store && p?.prices[item.id]?.[store]
                const tag =
                  !priced || !plan || crossed
                    ? ''
                    : plan.notFound.includes(item.id)
                      ? t.prices.notFound
                      : store && !offer
                        ? t.prices.notAt(t.stores[store])
                        : ''
                const line = need && offer ? lineOf(need, offer) : null
                // With a price, − and + move by one unit of sale of the selected store (a pack, a piece, a tray), so each tap
                // changes what's paid and the line adds up to what the cart adds. Without one, by the food's own step.
                const step = offer ? offer.base_qty : undefined
                // The units of the selected store, or the catalog's pack where there is no price.
                const bought = need && offer && line ? line.packs * offer.base_qty : buy
                const amount = crossed
                  ? needs
                  : need && offer && line
                    ? `${line.packs} × ${qty(offer.base_qty, item.unit)}`
                    : buyText(item, buy)
                return (
                  <li key={item.id} className={[crossed && 'have', tag && 'unavailable'].filter(Boolean).join(' ') || undefined}>
                    <div className="main">
                      <label>
                        <input
                          type="checkbox"
                          checked={crossed}
                          aria-label={t.list.have(name)}
                          onChange={() => toggle(item, crossed)}
                        />
                        <span className="item">
                          <span>{name}</span>
                          {tag && <small className="muted">{tag}</small>}
                          {line && offer && store && (
                            <small className="muted">
                              <a href={offer.url} target="_blank" rel="noreferrer">
                                {t.prices.product(offer.name ?? '', t.stores[store])}
                              </a>
                            </small>
                          )}
                          {!crossed && Math.abs(bought - item.amount) > 1e-9 && (
                            <small className="muted">
                              ({t.list.menuNeeds} {needs})
                            </small>
                          )}
                        </span>
                      </label>
                      <div className="stepper">
                        <button
                          type="button"
                          className="step"
                          aria-label={t.list.less(name)}
                          disabled={crossed}
                          onClick={() => save(stepHave(item, have, -1, step))}
                        >
                          −
                        </button>
                        <span className="amount">{amount}</span>
                        <button
                          type="button"
                          className="step"
                          aria-label={t.list.more(name)}
                          disabled={buy >= toBuy(item, {})}
                          onClick={() => save(stepHave(item, have, 1, step))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="cost">{crossed ? (priced ? money(0) : '') : line ? money(line.cost) : ''}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
      {priced && p && tab && !nothingToBuy && <Order p={p} store={tab} />}
    </div>
  )
}
