import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { days as order, type MenuData } from '../supabase/functions/_shared/menu.ts'
import { supabase } from './supabase'
import { t } from './strings'

type MenuRow = { data: MenuData; confirmed_at: string | null }

const byDay = (days: MenuData['days']) => [...days].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day))

// The week as a save_menu call saved it, shown in the chat under that reply.
export function MenuPreview({ menu, onOpen }: { menu: MenuData; onOpen: () => void }) {
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
      <button onClick={onOpen}>{t.chat.openMenu}</button>
    </div>
  )
}

export default function Menu({ session, onChange }: { session: Session; onChange: (draft: string) => void }) {
  // undefined while loading, null when the AI hasn't saved a menu yet.
  const [menu, setMenu] = useState<MenuRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('menus')
      .select('data, confirmed_at')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(t.menu.loadError)
        else setMenu(data)
      })
  }, [])

  async function confirm() {
    setBusy(true)
    setError('')
    const confirmed_at = new Date().toISOString()
    const { error } = await supabase.from('menus').update({ confirmed_at }).eq('user_id', session.user.id)
    if (error) setError(t.menu.confirmError)
    else setMenu((m) => m && { ...m, confirmed_at })
    setBusy(false)
  }

  if (menu === undefined) return error ? <p role="alert" className="menu">{error}</p> : null
  if (!menu) return <p className="menu">{t.menu.empty}</p>

  const recipes = new Map(menu.data.recipes.map((recipe) => [recipe.id, recipe]))
  const days = byDay(menu.data.days)

  return (
    <div className="menu">
      {days.map(({ day, meals }) => (
        <section key={day}>
          <div className="menu-day">
            <h2>{t.menu.days[day]}</h2>
            <button
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
      {menu.confirmed_at ? (
        <p className="muted">{t.menu.confirmed}</p>
      ) : (
        <button disabled={busy} onClick={confirm}>
          {t.menu.confirm}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
