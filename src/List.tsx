import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { CatalogKey, Unit } from '../supabase/functions/_shared/catalog.ts'
import { buildList, stepHave, toBuy, type Have, type Item } from '../supabase/functions/_shared/list.ts'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { supabase } from './supabase'
import { t } from './strings'

type MenuRow = { data: MenuData; confirmed_at: string | null; have: Have }

const sections = Object.keys(t.list.sections) as (keyof typeof t.list.sections)[]

// Saves and loads run one after another, so quick taps land in order and a remounted tab reads after them.
let queue: Promise<unknown> = Promise.resolve()
function inTurn<T>(task: () => PromiseLike<T>): Promise<T> {
  const run = queue.then(task)
  queue = run.catch(() => {})
  return run
}

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

export default function List({ session, onOpenMenu }: { session: Session; onOpenMenu: () => void }) {
  // undefined while loading, null when the AI hasn't saved a menu yet.
  const [menu, setMenu] = useState<MenuRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Reads again whenever the app comes back to the screen, so marks saved from the chat or another device
  // show up before the next tap writes the whole map over them.
  useEffect(() => {
    const load = () =>
      inTurn(() => supabase.from('menus').select('data, confirmed_at, have').maybeSingle()).then(
        ({ data, error }) => {
          if (error) setError(t.menu.loadError)
          else setMenu(data)
        },
      )
    const onVisible = () => document.visibilityState === 'visible' && load()
    load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  if (menu === undefined) return error ? <p role="alert" className="list">{error}</p> : null
  if (!menu) return <p className="list">{t.menu.empty}</p>
  if (!menu.confirmed_at) {
    return (
      <div className="list">
        <p>{t.list.confirmFirst}</p>
        <button onClick={onOpenMenu}>{t.chat.openMenu}</button>
      </div>
    )
  }

  const { have } = menu
  const items = buildList(menu.data)
  const text = [
    t.list.title,
    ...sections.flatMap((section) => {
      const lines = items
        .filter((item) => item.section === section && toBuy(item, have) > 0)
        .map((item) => `- ${nameOf(item)}: ${buyText(item, toBuy(item, have))}`)
      return lines.length ? ['', t.list.sections[section], ...lines] : []
    }),
  ].join('\n')
  const nothingToBuy = items.every((item) => toBuy(item, have) === 0)

  // The screen changes at once. Each save sends the whole map, so the last one to land decides what's stored.
  function save(next: Have) {
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
