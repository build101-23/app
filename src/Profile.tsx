import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'
import { Alert, AlertIcon, EmptyState } from './ui'

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
  // null or missing: never set, numbers hidden. Also set by the switch below, through set_show_numbers.
  show_numbers?: boolean | null
}

export default function Profile({ session, onOpenChat }: { session: Session; onOpenChat: () => void }) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [failed, setFailed] = useState(false)
  const [numbersError, setNumbersError] = useState('')

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

  // The switch changes at once, and goes back if saving fails.
  async function setNumbers(on: boolean) {
    const before = data?.show_numbers
    setNumbersError('')
    setData((d) => d && { ...d, show_numbers: on })
    const { error } = await supabase.rpc('set_show_numbers', { show_numbers: on })
    if (error) {
      setData((d) => d && { ...d, show_numbers: before })
      setNumbersError(t.profile.numbersError)
    }
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
        <>
          <div className="card facts skeleton" role="status">
            <span className="sr-only">{t.profile.loading}</span>
            {[0, 1, 2].map((row) => (
              <div key={row} aria-hidden="true">
                <span className="skeleton-line label" />
                <span className="skeleton-line value" />
              </div>
            ))}
          </div>
          {[3, 2].map((chips) => (
            <section key={chips} className="group skeleton" aria-hidden="true">
              <span className="skeleton-line heading" />
              <ul className="chips">
                {Array.from({ length: chips }, (_, i) => (
                  <li key={i} className="skeleton-line" />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
      {/* Even with nothing saved yet: numbers are optional and can be turned on any time. */}
      {data && (
        <section className="settings">
          <h2>{t.profile.settings}</h2>
          <div className="card settings-card">
            <label className="switch">
              <span>{t.profile.numbers}</span>
              <input
                type="checkbox"
                role="switch"
                checked={data.show_numbers === true}
                onChange={(e) => setNumbers(e.target.checked)}
              />
            </label>
          </div>
          {numbersError && <Alert text={numbersError} />}
        </section>
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
    return <EmptyState text={t.profile.empty} action={t.profile.openChat} onAction={onOpenChat} />
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
