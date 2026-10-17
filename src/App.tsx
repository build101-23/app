import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'
import Chat from './Chat'
import Profile from './Profile'

const tabs = ['chat', 'menu', 'list', 'profile'] as const
type Tab = (typeof tabs)[number]

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return null
  return session ? <Shell session={session} /> : <SignIn />
}

// shortcut: the magic link opens Safari on an installed iOS PWA, switch to an emailed code once we have our own SMTP (milestone 6)
function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="signin">
      <h1>{t.signIn.title}</h1>
      <form onSubmit={submit}>
        <label>
          {t.signIn.email}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            disabled={sent}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {sent ? <p>{t.signIn.sent}</p> : <button disabled={busy}>{t.signIn.send}</button>}
        {sent && (
          <button type="button" className="link" onClick={() => setSent(false)}>
            {t.signIn.otherEmail}
          </button>
        )}
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}

function Shell({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div className="shell">
      <header>
        <h1>{t.tabs[tab]}</h1>
      </header>
      <main>
        {tab === 'chat' && <Chat session={session} />}
        {tab === 'profile' && <Profile session={session} />}
        {(tab === 'menu' || tab === 'list') && <p className="soon">{t.soon}</p>}
      </main>
      <nav>
        {tabs.map((key) => (
          <button key={key} aria-current={key === tab ? 'page' : undefined} onClick={() => setTab(key)}>
            {t.tabs[key]}
          </button>
        ))}
      </nav>
    </div>
  )
}
