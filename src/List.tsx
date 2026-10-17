import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { CatalogKey, Unit } from '../supabase/functions/_shared/catalog.ts'
import { buildList, left, stepHave, toBuy, type Have, type Item } from '../supabase/functions/_shared/list.ts'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
// Temporary example prices: swapped for the real loader per ADR 0019.
import { examplePrices, pricesDate } from '../supabase/functions/_shared/prices.ts'
import { planStores, type Option } from '../supabase/functions/_shared/stores.ts'
import { supabase } from './supabase'
import { t } from './strings'

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
const nameOf = (item: Item) => item.other_name ?? t.foods[item.food as CatalogKey]
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

// Priced on what's left to buy, unrounded; crossed-out items have nothing left.
function priceList(items: Item[], have: Have) {
  const toPrice = items.map((item) => ({ id: item.id, amount: left(item, have) })).filter((need) => need.amount > 0)
  const plan = planStores(toPrice, examplePrices)
  return { plan, priced: toPrice.length > plan.notFound.length }
}

const money = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format
const pricesDay = new Date(pricesDate).toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })
const optionText = ({ stores, total }: Option) =>
  stores.length === 1
    ? t.prices.oneStore(t.stores[stores[0]], money(total))
    : t.prices.split(t.stores[stores[0]], t.stores[stores[1]], money(total))

// The menu version the user picked the split for. Another menu starts on one store again, the default.
// shortcut: the pick lives in this browser; move it next to menus.have if people switch devices
function readPick() {
  try {
    return localStorage.getItem('storePick')
  } catch {
    return null
  }
}

// The list as it stands, with its total: the chat's card under a list tool call. Live, like the List tab.
export function ListPreview({ row, busy, onOpen }: { row: MenuRow; busy: boolean; onOpen: () => void }) {
  const items = buildList(row.data)
  const { plan, priced } = priceList(items, row.have)
  const { single, split, notFound } = plan
  const chosen = (readPick() === row.updated_at && split) || single || split
  const nothingToBuy = items.every((item) => toBuy(item, row.have) === 0)
  const total = chosen
    ? `${optionText(chosen)}${single ? '' : ` ${t.prices.noOneStore}`}`
    : `${t.prices.noOneStore} ${plan.perStore.map(({ store, total }) => `${t.stores[store]} ${money(total)}`).join(' · ')}`
  return (
    <div className="bubble assistant list-preview">
      <p>{nothingToBuy ? t.list.nothingLeft : listText(items, row.have)}</p>
      {priced && (
        <p>
          <strong>{total}</strong>
          <small className="muted">
            {notFound.length > 0 && `\n${t.prices.missing(notFound.length)}`}
            {`\n${t.prices.sample(pricesDay)}`}
          </small>
        </p>
      )}
      <button disabled={busy} onClick={onOpen}>
        {t.chat.openList}
      </button>
    </div>
  )
}

export default function List({ session }: { session: Session }) {
  // undefined while loading, null when the AI hasn't saved a menu yet.
  const [menu, setMenu] = useState<MenuRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pickedFor, setPickedFor] = useState(readPick)

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

  if (menu === undefined) return error ? <p role="alert" className="list">{error}</p> : null
  if (!menu) return <p className="list">{t.menu.empty}</p>

  const { have, updated_at } = menu
  const items = buildList(menu.data)
  const text = listText(items, have)
  const nothingToBuy = items.every((item) => toBuy(item, have) === 0)

  const { plan, priced } = priceList(items, have)
  const { single, split } = plan
  const chosen = (pickedFor === updated_at && split) || single || split

  function pick(toSplit: boolean) {
    const version = toSplit ? updated_at : null
    try {
      if (version) localStorage.setItem('storePick', version)
      else localStorage.removeItem('storePick')
    } catch {
      // Private mode: the pick only lasts while the tab is open.
    }
    setPickedFor(version)
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
    <div className="list">
      {priced && (
        <section className="prices">
          <h2 id="where">{t.prices.where}</h2>
          {single && split ? (
            <div role="radiogroup" aria-labelledby="where">
              <label>
                <input type="radio" name="where" checked={chosen === single} onChange={() => pick(false)} />
                <span>{optionText(single)}</span>
              </label>
              <label>
                <input type="radio" name="where" checked={chosen === split} onChange={() => pick(true)} />
                <span>
                  {optionText(split)} · {t.prices.cheaperThan(money(single.total - split.total), t.stores[single.stores[0]])}
                </span>
              </label>
            </div>
          ) : (
            chosen && (
              <p>
                {optionText(chosen)}
                {!single && ` ${t.prices.noOneStore}`}
              </p>
            )
          )}
          {chosen && chosen.saving > 0 && <p>{t.prices.saving(money(chosen.saving))}</p>}
          <ul>
            {plan.perStore.map(({ store, total, missing }) => (
              <li key={store}>
                {t.stores[store]} {money(total)}
                {missing > 0 && ` · ${t.prices.missing(missing)}`}
              </li>
            ))}
          </ul>
          <p className="muted">{t.prices.sample(pricesDay)}</p>
        </section>
      )}
      <p className="muted">{t.list.hint}</p>
      <div className="list-actions">
        <button disabled={nothingToBuy} onClick={share}>
          {t.list.share}
        </button>
        <button disabled={nothingToBuy} onClick={copy}>
          {t.list.copy}
        </button>
        {Object.keys(have).length > 0 && (
          <button className="link" onClick={() => window.confirm(t.list.resetConfirm) && save({})}>
            {t.list.reset}
          </button>
        )}
      </div>
      {notice && <p className="muted">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      {sections.map((section) => {
        const inSection = items.filter((item) => item.section === section)
        if (!inSection.length) return null
        return (
          <section key={section}>
            <h2>{t.list.sections[section]}</h2>
            <ul>
              {inSection.map((item) => {
                const name = nameOf(item)
                const buy = toBuy(item, have)
                const crossed = buy === 0
                const needs = qty(item.amount, item.unit)
                const store = chosen && chosen.stores.length === 2 ? chosen.at[item.id] : undefined
                const tag = !priced ? '' : plan.notFound.includes(item.id) ? t.prices.notFound : store ? t.stores[store] : ''
                return (
                  <li key={item.id} className={crossed ? 'have' : undefined}>
                    <label>
                      <input
                        type="checkbox"
                        checked={crossed}
                        aria-label={t.list.have(name)}
                        onChange={() => toggle(item, crossed)}
                      />
                      <span>{name}</span>
                      {tag && <small className="muted">{tag}</small>}
                    </label>
                    <span className="qty">
                      {crossed ? needs : buyText(item, buy)}
                      {!crossed && qty(buy, item.unit) !== needs && (
                        <small className="muted">
                          ({t.list.menuNeeds} {needs})
                        </small>
                      )}
                    </span>
                    <button
                      className="step"
                      aria-label={t.list.less(name)}
                      disabled={crossed}
                      onClick={() => save(stepHave(item, have, -1))}
                    >
                      −
                    </button>
                    <button
                      className="step"
                      aria-label={t.list.more(name)}
                      disabled={buy >= toBuy(item, {})}
                      onClick={() => save(stepHave(item, have, 1))}
                    >
                      +
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
