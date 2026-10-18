import { useEffect, useState } from 'react'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { addMacros } from '../supabase/functions/_shared/nutrition.ts'
import { nextOrder, todayInMontevideo } from '../supabase/functions/_shared/repeat.ts'
import { supabase } from './supabase'
import { t } from './strings'
import { Alert, ChatIcon, ChevronIcon, EmptyState, MenuIcon, PageSkeleton, RepeatIcon } from './ui'

// repeat_every and repeat_from: the recurring order, both null when it doesn't repeat (ADR 0039).
type MenuRow = { user_id: string; data: MenuData; repeat_every: number | null; repeat_from: string | null }

// "520 kcal · 35 g prote · 60 g carbos · 15 g grasa (sin contar espinaca)", for the numbers switch.
function macrosLine({ kcal, protein, carbs, fat, missing }: ReturnType<typeof addMacros>) {
  const f = (n: number) => Math.round(n).toLocaleString('es-UY')
  const line = t.menu.macros(f(kcal), f(protein), f(carbs), f(fat))
  return missing.length ? `${line} (${t.menu.without([...new Set(missing)].join(', '))})` : line
}

// The menu as a save_menu call saved it, shown in the chat under that reply: a card with one row per day. Here and in
// the tab, days keep their saved order: a menu can start on any day (ADR 0028).
export function MenuPreview({ menu, busy, onOpen }: { menu: MenuData; busy: boolean; onOpen: () => void }) {
  const names = new Map(menu.recipes.map((recipe) => [recipe.id, recipe.name]))
  return (
    <section className="menu-card" aria-label={t.chat.menuCard.title}>
      <header>
        <span className="badge">
          <MenuIcon />
        </span>
        <strong>{t.chat.menuCard.title}</strong>
        <span className="pill">{t.chat.menuCard.length(menu.days.length)}</span>
      </header>
      <ul>
        {menu.days.map(({ day, meals }) => (
          <li key={day}>
            {/* Three letters on screen; the whole day for screen readers. */}
            <span className="day" aria-hidden="true">
              {t.menu.days[day].slice(0, 3)}
            </span>
            <span className="sr-only">{t.menu.days[day]}: </span>
            <span className="meals">{meals.map((meal) => names.get(meal.recipe_id)).join(' · ')}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="button secondary" disabled={busy} onClick={onOpen}>
        {t.chat.openMenu}
        <ChevronIcon />
      </button>
    </section>
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
  // Which day of the menu is open. The menu starts tomorrow, so there's no "today" to default to.
  const [selected, setSelected] = useState(0)

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
    return <div className="page menu">{error ? <Alert text={error} /> : <PageSkeleton label={t.menu.loading} shape="menu" />}</div>
  }
  if (!menu) {
    return (
      <div className="page menu">
        <EmptyState text={t.menu.empty} action={t.profile.openChat} onAction={() => onChange('')} />
      </div>
    )
  }

  const recipes = new Map(menu.data.recipes.map((recipe) => [recipe.id, recipe]))
  const { days } = menu.data
  const { day, meals } = days[Math.min(selected, days.length - 1)]
  const dayName = t.menu.days[day]

  return (
    <div className="page menu">
      <RepeatCard menu={menu} onSaved={setMenu} />
      {/* Native radios: one tab stop, arrow keys move between days. The visible text is the first three letters;
          the accessible name is the whole day. */}
      {days.length > 1 && (
        <fieldset className="days">
          <legend className="sr-only">{t.menu.dayPicker}</legend>
          {days.map((entry, i) => (
            <label key={entry.day}>
              <input
                type="radio"
                name="day"
                aria-label={t.menu.days[entry.day]}
                checked={i === selected}
                onChange={() => setSelected(i)}
              />
              <span>{t.menu.days[entry.day].slice(0, 3)}</span>
            </label>
          ))}
        </fieldset>
      )}
      {/* Keyed by day, so the page's fade-in plays again on each switch. */}
      <section className="card day-card" key={day}>
        <h2>{dayName}</h2>
        {showNumbers && (
          <p className="macros">
            {t.menu.dayTotal}: {macrosLine(addMacros(meals.flatMap((meal) => recipes.get(meal.recipe_id)?.ingredients ?? [])))}
          </p>
        )}
        {meals.map((meal, i) => {
          const recipe = recipes.get(meal.recipe_id)
          if (!recipe) return null
          return (
            // One meal open at a time, natively, where `name` is supported.
            <details key={i} name="meal">
              <summary>
                <span className="slot">{meal.slot}</span>
                <span className="recipe">{recipe.name}</span>
                {showNumbers && <small className="macros">{macrosLine(addMacros(recipe.ingredients))}</small>}
                <ChevronIcon />
              </summary>
              <div className="meal-body">
                <div>
                  <h3>{t.menu.ingredients}</h3>
                  <ul>
                    {recipe.ingredients.map((item, j) => (
                      <li key={j}>
                        <span>{item.food === 'other' ? item.other_name : (t.foods[item.food] ?? item.food)}</span>
                        <span>
                          {item.amount.toLocaleString('es-UY')} {t.menu.units[item.unit]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>{t.menu.how}</h3>
                  <p>{recipe.how}</p>
                </div>
                <button type="button" className="button secondary" onClick={() => onChange(t.menu.changeMeal(meal.slot, dayName))}>
                  <ChatIcon />
                  {t.menu.changeThisMeal}
                </button>
              </div>
            </details>
          )
        })}
      </section>
      <button type="button" className="button secondary" onClick={() => onChange(t.menu.changeDay(dayName))}>
        <ChatIcon />
        {t.menu.changeThisDay(dayName)}
      </button>
    </div>
  )
}
