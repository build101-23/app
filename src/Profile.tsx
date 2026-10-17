import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'

// The shape the chat's save_profile tool writes (supabase/functions/chat/index.ts).
type ProfileData = {
  goal?: string | null
  meals_per_day?: number | null
  cooking_time?: string | null
  follows_nutritionist_plan?: boolean | null
  nutritionist_plan_notes?: string | null
  cant_eat?: string[]
  dislike?: string[]
  like?: string[]
  want?: string[]
}

export default function Profile({ session }: { session: Session }) {
  const [data, setData] = useState<ProfileData | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('data')
      .maybeSingle()
      .then(({ data }) => setData(data?.data ?? {}))
  }, [])

  if (!data) return null

  const plan =
    data.follows_nutritionist_plan == null
      ? null
      : data.follows_nutritionist_plan
        ? data.nutritionist_plan_notes || t.profile.yes
        : t.profile.no
  const facts: [string, string | number | null | undefined][] = [
    [t.profile.goal, data.goal],
    [t.profile.meals, data.meals_per_day],
    [t.profile.cookingTime, data.cooking_time],
    [t.profile.plan, plan],
  ]
  const lists: [string, string[] | undefined][] = [
    [t.profile.cantEat, data.cant_eat],
    [t.profile.dislike, data.dislike],
    [t.profile.like, data.like],
    [t.profile.want, data.want],
  ]
  const shownFacts = facts.filter(([, value]) => value != null && value !== '')
  const shownLists = lists.filter(([, items]) => items?.length)

  return (
    <div className="profile">
      {shownFacts.length + shownLists.length === 0 && <p>{t.profile.empty}</p>}
      {shownFacts.length > 0 && (
        <dl>
          {shownFacts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {shownLists.map(([label, items]) => (
        <section key={label}>
          <h2>{label}</h2>
          <ul>
            {items!.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="muted">{session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>{t.profile.signOut}</button>
    </div>
  )
}
