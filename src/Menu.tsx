import { useEffect, useState } from 'react'
import { days as order, type MenuData } from '../supabase/functions/_shared/menu.ts'
import { addMacros } from '../supabase/functions/_shared/nutrition.ts'
import { supabase } from './supabase'
import { t } from './strings'

type MenuRow = { data: MenuData }

const byDay = (days: MenuData['days']) => [...days].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day))

// "520 kcal · 35 g prote · 60 g carbos · 15 g grasa (sin contar espinaca)", for the numbers switch.
function macrosLine({ kcal, protein, carbs, fat, missing }: ReturnType<typeof addMacros>) {
  const f = (n: number) => Math.round(n).toLocaleString('es-UY')
  const line = t.menu.macros(f(kcal), f(protein), f(carbs), f(fat))
  return missing.length ? `${line} (${t.menu.without([...new Set(missing)].join(', '))})` : line
}

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
      <button disabled={busy} onClick={onOpen}>
        {t.chat.openMenu}
      </button>
    </div>
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
      .select('data')
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
