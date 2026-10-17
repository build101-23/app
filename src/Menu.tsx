import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { days as order, type MenuData } from '../supabase/functions/_shared/menu.ts'
import { supabase } from './supabase'
import { t } from './strings'
import { Alert, EmptyState, PageSkeleton } from './ui'

// updated_at: the menu's version, which every save_menu changes.
type MenuRow = { data: MenuData; confirmed_at: string | null; updated_at: string }

const byDay = (days: MenuData['days']) => [...days].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day))

// The week as a save_menu call saved it, shown in the chat under that reply.
export function MenuPreview({ menu, busy, onOpen }: { menu: MenuData; busy: boolean; onOpen: () => void }) {
  const names = new Map(menu.recipes.map((recipe) => [recipe.id, recipe.name]))
  return (
    <div className="bubble assistant menu-preview">
      <ul>
        {byDay(menu.days).map(({ day, meals }) => (
          <li key={day}>
            <strong>{t.menu.days[day]}</strong>
            {meals.map((meal) => names.get(meal.recipe_id)).join(' · ')}
          </li>
        ))}
      </ul>
      <button type="button" className="button secondary" disabled={busy} onClick={onOpen}>
        {t.chat.openMenu}
      </button>
    </div>
  )
}

export default function Menu({ session, onChange }: { session: Session; onChange: (draft: string) => void }) {
  // undefined while loading, null when the AI hasn't saved a menu yet.
  const [menu, setMenu] = useState<MenuRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Where focus goes once "Confirmar menú" is replaced by its result, so it isn't dropped on the page.
  const status = useRef<HTMLParagraphElement>(null)
  const confirmedNow = useRef(false)

  useEffect(() => {
    if (!confirmedNow.current || !menu?.confirmed_at) return
    confirmedNow.current = false
    status.current?.focus()
  }, [menu?.confirmed_at])

  function load() {
    return supabase
      .from('menus')
      .select('data, confirmed_at, updated_at')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(t.menu.loadError)
        else setMenu(data)
      })
  }

  useEffect(() => {
    load()
  }, [])

  async function confirm(version: string) {
    setBusy(true)
    setError('')
    const confirmed_at = new Date().toISOString()
    // Only the version on screen: the chat may have saved a newer menu since this tab loaded.
    const { data, error } = await supabase
      .from('menus')
      .update({ confirmed_at })
      .eq('user_id', session.user.id)
      .eq('updated_at', version)
      .select('updated_at')
    if (error) setError(t.menu.confirmError)
    else if (!data.length) await load().then(() => setError((e) => e || t.menu.changed))
    else {
      confirmedNow.current = true
      setMenu((m) => m && { ...m, confirmed_at })
    }
    setBusy(false)
  }

  if (menu === undefined) {
    return <div className="page menu">{error ? <Alert text={error} /> : <PageSkeleton label={t.menu.loading} />}</div>
  }
  if (!menu) {
    return (
      <div className="page menu">
        <EmptyState text={t.menu.empty} action={t.profile.openChat} onAction={() => onChange('')} />
      </div>
    )
  }

  const recipes = new Map(menu.data.recipes.map((recipe) => [recipe.id, recipe]))
  const days = byDay(menu.data.days)

  return (
    <div className="page menu">
      {/* Always mounted, so the confirmation is announced when its text appears. */}
      <p className="muted menu-status" role="status" ref={status} tabIndex={-1}>
        {menu.confirmed_at ? t.menu.confirmed : ''}
      </p>
      {!menu.confirmed_at && (
        <button
          type="button"
          className="button primary"
          disabled={busy}
          aria-busy={busy}
          onClick={() => confirm(menu.updated_at)}
        >
          {busy ? t.menu.confirming : t.menu.confirm}
        </button>
      )}
      {error && <Alert text={error} />}
      {days.map(({ day, meals }) => (
        <section key={day}>
          <div className="menu-day">
            <h2>{t.menu.days[day]}</h2>
            <button
              type="button"
              className="link"
              aria-label={t.menu.changeDay(t.menu.days[day]).trim()}
              onClick={() => onChange(t.menu.changeDay(t.menu.days[day]))}
            >
              {t.menu.change}
            </button>
          </div>
          {meals.map((meal, i) => {
            const recipe = recipes.get(meal.recipe_id)
            if (!recipe) return null
            return (
              <details key={i}>
                <summary>
                  <span className="muted">{meal.slot}</span> {recipe.name}
                </summary>
                <ul>
                  {recipe.ingredients.map((item, j) => (
                    <li key={j}>
                      {item.food === 'other' ? item.other_name : (t.foods[item.food] ?? item.food)}:{' '}
                      {item.amount.toLocaleString('es-UY')} {t.menu.units[item.unit]}
                    </li>
                  ))}
                </ul>
                <p>{recipe.how}</p>
                <button
                  type="button"
                  className="link"
                  aria-label={t.menu.changeMeal(meal.slot, t.menu.days[day]).trim()}
                  onClick={() => onChange(t.menu.changeMeal(meal.slot, t.menu.days[day]))}
                >
                  {t.menu.change}
                </button>
              </details>
            )
          })}
        </section>
      ))}
    </div>
  )
}
