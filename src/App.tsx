import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'
import Chat from './Chat'
import GoogleSignIn from './GoogleSignIn'
import { googleAvailable } from './google'
import List from './List'
import Menu from './Menu'
import Profile from './Profile'
import { AlertIcon, ChatIcon, ListIcon, MailIcon, MenuIcon, ProfileIcon, Tile, Wordmark } from './ui'

const tabs = ['chat', 'menu', 'list', 'profile'] as const
type Tab = (typeof tabs)[number]
const icons = { chat: ChatIcon, menu: MenuIcon, list: ListIcon, profile: ProfileIcon }

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

  if (loading) return <Splash />
  return session ? <Shell session={session} /> : <SignIn />
}

// Shows up only if the session takes more than a moment (the fade-in is delayed in CSS).
function Splash() {
  return (
    <div className="splash" role="status">
      <Tile size={88} animated />
      <span className="sr-only">{t.loading}</span>
    </div>
  )
}

// Google leads. The magic link stays as the other way in: opened on request, and the only way in when Google
// isn't configured or its button can't load.
// shortcut: the magic link opens Safari on an installed iOS PWA, switch to an emailed code once we have our own SMTP (milestone 6)
function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [google, setGoogle] = useState(googleAvailable)
  const [withEmail, setWithEmail] = useState(!googleAvailable)
  const emailInput = useRef<HTMLInputElement>(null)
  const googleUnreachable = useCallback(() => {
    setGoogle(false)
    setWithEmail(true)
  }, [])

  // The toggle disappears once pressed, so focus moves on to the field it opened.
  function openEmail() {
    flushSync(() => setWithEmail(true))
    emailInput.current?.focus()
  }

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
    <div className="signin-screen">
      <main className="signin">
        <div className="lockup">
          <Tile size={48} />
          <Wordmark height={26} />
        </div>
        <div className="signin-body">
          <header>
            <h1>{t.signIn.title}</h1>
            <p>{google ? t.signIn.googleHint : t.signIn.hint}</p>
          </header>
          <div className="card signin-card">
            {googleAvailable && !sent && <GoogleSignIn onUnreachable={googleUnreachable} />}
            {!withEmail && !sent ? (
              <button type="button" className="button quiet email-toggle" onClick={openEmail}>
                {t.signIn.useEmail}
              </button>
            ) : sent ? (
              <div className="sent" role="status">
                <span className="sent-badge">
                  <MailIcon />
                </span>
                <p>{t.signIn.sent}</p>
                <p className="sent-email">{email}</p>
                <button type="button" className="button quiet" onClick={() => setSent(false)}>
                  {t.signIn.otherEmail}
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                {google && <p className="email-hint">{t.signIn.hint}</p>}
                <label className="field">
                  {t.signIn.email}
                  <input
                    ref={emailInput}
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button
                  className={google ? 'button secondary' : 'button primary'}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy ? t.signIn.sending : t.signIn.send}
                </button>
                {error && (
                  // Supabase's message is in English; keep it as a detail under the Spanish one.
                  <div role="alert" className="alert">
                    <AlertIcon />
                    <div>
                      <p>{t.signIn.error}</p>
                      <p className="alert-detail">{error}</p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// True while the on-screen keyboard takes up part of the screen, read from the visual viewport
// (zoom-independent). The CSS uses it to move the dock aside only while you're actually typing.
function useKeyboardOpen() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    let width = viewport.width * viewport.scale
    let full = viewport.height * viewport.scale
    const update = () => {
      const w = viewport.width * viewport.scale
      const h = viewport.height * viewport.scale
      // A rotation changes the full height, so start over.
      if (Math.abs(w - width) > 1) {
        width = w
        full = h
      }
      full = Math.max(full, h)
      setOpen(full - h > 120)
    }
    viewport.addEventListener('resize', update)
    return () => viewport.removeEventListener('resize', update)
  }, [])

  return open
}

function Shell({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('chat')
  // A draft the Menu tab hands to the chat ("Cambiar ..."); Chat reads it when it mounts.
  const [chatDraft, setChatDraft] = useState('')
  // Leaving Chat mid-reply would unmount it and hide a turn that's still being saved.
  const [chatBusy, setChatBusy] = useState(false)
  const keyboardOpen = useKeyboardOpen()

  return (
    <div className="shell" data-keyboard={keyboardOpen ? 'open' : undefined}>
      <header>
        <Tile size={30} />
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
        {tab === 'list' && <List session={session} />}
        {tab === 'profile' && <Profile session={session} onOpenChat={() => setTab('chat')} />}
      </main>
      <nav aria-label={t.nav}>
        {tabs.map((key) => {
          const Icon = icons[key]
          return (
            <button
              key={key}
              type="button"
              aria-current={key === tab ? 'page' : undefined}
              disabled={chatBusy}
              onClick={() => {
                setTab(key)
                setChatDraft('')
              }}
            >
              <Icon />
              <span>{t.tabs[key]}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
