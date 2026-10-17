import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'
import Chat from './Chat'
import List from './List'
import Menu from './Menu'
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
  // A draft the Menu tab hands to the chat ("Cambiar ..."); Chat reads it when it mounts.
  const [chatDraft, setChatDraft] = useState('')
  // Leaving Chat mid-reply would unmount it and hide a turn that's still being saved.
  const [chatBusy, setChatBusy] = useState(false)

  return (
    <div className="shell">
      <header>
        <h1>{t.tabs[tab]}</h1>
      </header>
      <main>
        {tab === 'chat' && (
          <Chat
            session={session}
            initialDraft={chatDraft}
            onBusy={setChatBusy}
            onOpenMenu={() => setTab('menu')}
            onOpenList={() => setTab('list')}
          />
        )}
        {tab === 'menu' && (
          <Menu
            onChange={(draft) => {
              setChatDraft(draft)
              setTab('chat')
            }}
          />
        )}
        {tab === 'profile' && <Profile session={session} />}
        {tab === 'list' && <List session={session} />}
      </main>
      <nav>
        {tabs.map((key) => (
          <button
            key={key}
            aria-current={key === tab ? 'page' : undefined}
            disabled={chatBusy}
            onClick={() => {
              setTab(key)
              setChatDraft('')
            }}
          >
            {t.tabs[key]}
          </button>
        ))}
      </nav>
    </div>
  )
}
