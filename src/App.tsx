import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

const tabs = ['Chat', 'Menu', 'List', 'Profile'] as const
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
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            disabled={sent}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {sent ? (
          <p>Check your email and tap the link to sign in.</p>
        ) : (
          <button disabled={busy}>Email me a sign-in link</button>
        )}
        {sent && (
          <button type="button" className="link" onClick={() => setSent(false)}>
            Use another email
          </button>
        )}
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}

function Shell({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('Chat')

  return (
    <div className="shell">
      <header>
        <h1>{tab}</h1>
      </header>
      <main>
        {tab === 'Profile' ? (
          <>
            <p>{session.user.email}</p>
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
          </>
        ) : (
          <p>Coming soon.</p>
        )}
      </main>
      <nav>
        {tabs.map((t) => (
          <button key={t} aria-current={t === tab ? 'page' : undefined} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
    </div>
  )
}
