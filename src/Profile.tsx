import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'
import { AlertIcon, Tile } from './ui'

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

export default function Profile({ session, onOpenChat }: { session: Session; onOpenChat: () => void }) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [failed, setFailed] = useState(false)

  function load() {
    supabase
      .from('profiles')
      .select('data')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setFailed(true)
        else setData(data?.data ?? {})
      })
  }

  useEffect(load, [])

  function retry() {
    setFailed(false)
    load()
  }

  return (
    <div className="page profile">
      {failed ? (
        <div role="alert" className="alert">
          <AlertIcon />
          <div>
            <p>{t.profile.loadError}</p>
            <button type="button" className="button quiet" onClick={retry}>
              {t.retry}
            </button>
          </div>
        </div>
      ) : data ? (
        <Saved data={data} onOpenChat={onOpenChat} />
      ) : (
        <div className="card profile-skeleton" role="status">
          <span className="sr-only">{t.profile.loading}</span>
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
        </div>
      )}
      <section className="account">
        <h2>{t.profile.account}</h2>
        <div className="card account-card">
          <p className="account-email">{session.user.email}</p>
          <button type="button" className="button secondary" onClick={() => supabase.auth.signOut()}>
            {t.profile.signOut}
          </button>
        </div>
      </section>
    </div>
  )
}

function Saved({ data, onOpenChat }: { data: ProfileData; onOpenChat: () => void }) {
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

  if (shownFacts.length + shownLists.length === 0) {
    return (
      <div className="profile-empty">
        <Tile size={48} />
        <p>{t.profile.empty}</p>
        <button type="button" className="button primary" onClick={onOpenChat}>
          {t.profile.openChat}
        </button>
      </div>
    )
  }

  return (
    <>
      {shownFacts.length > 0 && (
        <dl className="card facts">
          {shownFacts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {shownLists.map(([label, items]) => (
        <section key={label} className="group">
          <h2>{label}</h2>
          <ul className="chips">
            {items!.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
