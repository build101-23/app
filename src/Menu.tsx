import { useEffect, useState } from 'react'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { addMacros } from '../supabase/functions/_shared/nutrition.ts'
import { nextOrder, todayInMontevideo } from '../supabase/functions/_shared/repeat.ts'
import { supabase } from './supabase'
import { t } from './strings'
import { Alert, EmptyState, PageSkeleton, RepeatIcon } from './ui'

// repeat_every and repeat_from: the recurring order, both null when it doesn't repeat (ADR 0030).
type MenuRow = { user_id: string; data: MenuData; repeat_every: number | null; repeat_from: string | null }

// "520 kcal · 35 g prote · 60 g carbos · 15 g grasa (sin contar espinaca)", for the numbers switch.
function macrosLine({ kcal, protein, carbs, fat, missing }: ReturnType<typeof addMacros>) {
  const f = (n: number) => Math.round(n).toLocaleString('es-UY')
  const line = t.menu.macros(f(kcal), f(protein), f(carbs), f(fat))
  return missing.length ? `${line} (${t.menu.without([...new Set(missing)].join(', '))})` : line
}

// The menu as a save_menu call saved it, shown in the chat under that reply. Here and in the tab, days keep their
// saved order: a menu can start on any day (ADR 0028).
export function MenuPreview({ menu, busy, onOpen }: { menu: MenuData; busy: boolean; onOpen: () => void }) {
  const names = new Map(menu.recipes.map((recipe) => [recipe.id, recipe.name]))
  return (
    <div className="bubble assistant menu-preview">
      <ul>
        {menu.days.map(({ day, meals }) => (
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

// "sábado, 25 de octubre". Noon, so no time zone moves the day.
const orderDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })

// The recurring order on top of the menu: off, a button that repeats it every as many days as the menu lasts; on, how
// often and the next date, and a button to stop it. Writes straight to menus, like the List tab's have (ADR 0014).
function RepeatCard({ menu, onSaved }: { menu: MenuRow; onSaved: (row: MenuRow) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { repeat_every: every, repeat_from: from } = menu
  const today = todayInMontevideo()

  async function save(repeat_every: number | null) {
    const repeat = { repeat_every, repeat_from: repeat_every ? today : null }
    setBusy(true)
    const { error } = await supabase.from('menus').update(repeat).eq('user_id', menu.user_id)
    setBusy(false)
    setError(error ? t.menu.repeat.saveError : '')
    if (!error) onSaved({ ...menu, ...repeat })
  }

  const next = every && from ? nextOrder(from, every, today) : ''
  return (
    <section className="repeat" aria-label={t.menu.repeat.title}>
      {every ? (
        <>
          <p>
            <RepeatIcon />
            <strong>{t.menu.repeat.every(every)}</strong>
          </p>
          <p className="muted">{next === today ? t.menu.repeat.today : t.menu.repeat.next(orderDay(next))}</p>
          <button type="button" className="button quiet" disabled={busy} onClick={() => save(null)}>
            {t.menu.repeat.stop}
          </button>
        </>
      ) : (
        <>
          <p className="muted">{t.menu.repeat.off(menu.data.days.length)}</p>
          <button
            type="button"
            className="button secondary"
            aria-busy={busy}
            disabled={busy}
            onClick={() => save(menu.data.days.length)}
          >
            <RepeatIcon />
            {t.menu.repeat.start}
          </button>
        </>
      )}
      {error && <Alert text={error} />}
    </section>
  )
}

export default function Menu({ onChange }: { onChange: (draft: string) => void }) {
  // undefined while loading, null when the AI hasn't saved a menu yet.
  const [menu, setMenu] = useState<MenuRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [showNumbers, setShowNumbers] = useState(false)

  useEffect(() => {
    supabase
      .from('menus')
      .select('user_id, data, repeat_every, repeat_from')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(t.menu.loadError)
        else setMenu(data)
      })
    supabase
      .from('profiles')
      .select('data')
      .maybeSingle()
      .then(({ data }) => setShowNumbers(data?.data?.show_numbers === true))
  }, [])

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

  return (
    <div className="page menu">
      <RepeatCard menu={menu} onSaved={setMenu} />
      {menu.data.days.map(({ day, meals }) => (
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
          {showNumbers && (
            <p className="macros">
              {t.menu.dayTotal}:{' '}
              {macrosLine(addMacros(meals.flatMap((meal) => recipes.get(meal.recipe_id)?.ingredients ?? [])))}
            </p>
          )}
          {meals.map((meal, i) => {
            const recipe = recipes.get(meal.recipe_id)
            if (!recipe) return null
            return (
              <details key={i}>
                <summary>
                  <span className="muted">{meal.slot}</span> {recipe.name}
                  {showNumbers && <small className="macros">{macrosLine(addMacros(recipe.ingredients))}</small>}
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
