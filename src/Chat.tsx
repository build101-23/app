import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'
import { AlertIcon, Mark, SendIcon } from './ui'

type Role = 'user' | 'assistant'
type Bubble = { role: Role; text: string }
type Row = { role: Role; content: { type: string; text?: string }[] }

// Only text is shown; thinking, tool calls and tool results stay hidden.
const toBubbles = (rows: Row[]): Bubble[] =>
  rows.flatMap((row) => {
    const text = row.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
    return text ? [{ role: row.role, text }] : []
  })

export default function Chat({ session }: { session: Session }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const healthData = useRef<HTMLDialogElement>(null)

  function loadHistory() {
    supabase
      .from('messages')
      .select('role, content')
      .order('id')
      .then(({ data, error }) => {
        setLoadFailed(!!error)
        if (!error) setBubbles(toBubbles(data))
        setLoaded(true)
      })
  }

  useEffect(loadHistory, [])

  function retry() {
    setLoaded(false)
    setLoadFailed(false)
    loadHistory()
  }

  // Braces matter: newer browsers return a Promise from scrollIntoView, and an effect may only return a cleanup.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [bubbles])

  // On phones the composer floats over the list (the dock's accessory), so the list reserves its height.
  // When the composer grows while you're at the end of the conversation, stay at the end.
  useEffect(() => {
    const form = composer.current
    const chat = root.current
    const list = log.current
    if (!form || !chat || !list) return
    const observer = new ResizeObserver(() => {
      const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 4
      chat.style.setProperty('--accessory-h', `${form.offsetHeight}px`)
      if (atEnd) list.scrollTop = list.scrollHeight
    })
    observer.observe(form)
    return () => observer.disconnect()
  }, [])

  // Grow the composer with its text where CSS `field-sizing` isn't supported yet (the CSS caps the height).
  useEffect(() => {
    const el = input.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [draft])

  async function submit(text: string) {
    if (!text || busy) return
    setBusy(true)
    setError('')
    setDraft('')
    setBubbles((b) => [...b, { role: 'user', text }, { role: 'assistant', text: '' }])
    const setReply = (reply: string) => setBubbles((b) => [...b.slice(0, -1), { role: 'assistant', text: reply }])

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      if (!res.ok || !res.body) throw new Error(`chat failed: ${res.status}`)
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let reply = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        reply += value
        setReply(reply)
      }
      if (!reply) setReply(t.chat.noReply)
    } catch {
      // The server stores nothing from a failed turn, so drop both bubbles and give the text back.
      setBubbles((b) => b.slice(0, -2))
      setDraft(text)
      setError(t.chat.error)
    }
    setBusy(false)
  }

  function send(e: FormEvent) {
    e.preventDefault()
    submit(draft.trim())
  }

  const waiting = busy && bubbles.at(-1)?.text === ''

  return (
    <div className="chat" ref={root}>
      <div className="messages" ref={log} role="log" aria-busy={busy || !loaded}>
        {!loaded && (
          <div className="chat-skeleton" role="status">
            <span className="sr-only">{t.chat.loading}</span>
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        )}
        {loadFailed && (
          <div role="alert" className="alert">
            <AlertIcon />
            <div>
              <p>{t.chat.loadError}</p>
              <button type="button" className="button quiet" onClick={retry}>
                {t.retry}
              </button>
            </div>
          </div>
        )}
        {loaded && !loadFailed && bubbles.length === 0 && !error && (
          <div className="chat-start">
            <p className="bubble assistant">{t.chat.welcome}</p>
            <ul className="intents" aria-label={t.chat.starters}>
              {t.chat.intents.map((intent) => (
                <li key={intent}>
                  <button type="button" className="intent" onClick={() => submit(intent)}>
                    {intent}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {bubbles.map((bubble, i) =>
          bubble.text ? (
            <p key={i} className={`bubble ${bubble.role}`}>
              {bubble.text}
            </p>
          ) : (
            // The reply's first words haven't arrived yet; the status line below says so.
            <p key={i} className="bubble assistant typing">
              <Mark size={26} animated />
            </p>
          ),
        )}
        {busy && (
          <p className="chat-status" role="status">
            {waiting ? t.chat.waiting : t.chat.typing}
          </p>
        )}
        {error && (
          <div role="alert" className="alert">
            <AlertIcon />
            <p>{error}</p>
          </div>
        )}
        <div ref={end} />
      </div>
      <form className="composer" ref={composer} onSubmit={send}>
        <textarea
          ref={input}
          rows={1}
          value={draft}
          placeholder={t.chat.placeholder}
          aria-label={t.chat.placeholder}
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          className="send"
          disabled={busy || !draft.trim()}
          aria-label={t.chat.send}
          // Keep focus (and the phone keyboard) in the textarea: a blur here would bring the dock back
          // mid-tap, shift the button out from under the finger and lose the click.
          onMouseDown={(e) => e.preventDefault()}
        >
          <SendIcon />
        </button>
        <p className="disclaimer">
          {t.chat.disclaimer}{' '}
          <button
            type="button"
            className="link"
            aria-haspopup="dialog"
            onClick={() => healthData.current?.showModal()}
          >
            {t.chat.healthData}
          </button>
        </p>
      </form>
      <HealthData dialog={healthData} />
    </div>
  )
}

// What the disclaimer's link opens. The consent itself isn't built yet (milestone 6).
function HealthData({ dialog }: { dialog: RefObject<HTMLDialogElement | null> }) {
  return (
    <dialog className="sheet" ref={dialog} aria-labelledby="health-data-title">
      <header>
        <h2 id="health-data-title">{t.healthData.title}</h2>
        <span className="pill">{t.soon}</span>
      </header>
      <p>{t.healthData.soon}</p>
      <p className="muted">{t.healthData.now}</p>
      <form method="dialog">
        <button className="button primary">{t.healthData.close}</button>
      </form>
    </dialog>
  )
}
