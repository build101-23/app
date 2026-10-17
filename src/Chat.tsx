import { useEffect, useRef, useState, type FormEvent } from 'react'
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
  // Messages loaded with the history; later ones are new and animate in.
  const [settled, setSettled] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const chat = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLFormElement>(null)

  function loadHistory() {
    supabase
      .from('messages')
      .select('role, content')
      .order('id')
      .then(({ data, error }) => {
        setLoadFailed(!!error)
        if (!error) {
          const history = toBubbles(data)
          setBubbles(history)
          setSettled(history.length)
        }
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

  // The composer floats over the end of the message list; keep its height in --composer-h so the last
  // message always scrolls clear of it. If you were at the end of the conversation, stay there when the
  // composer grows or the list resizes (keyboard up or down, the dock coming back).
  useEffect(() => {
    const form = composer.current
    const box = chat.current
    const list = box?.querySelector('.messages')
    if (!form || !box || !list) return
    let atEnd = true
    // Scrolls caused by a layout change (keyboard, dock, composer) aren't you leaving the end, so for a
    // moment after one, scroll events don't count.
    let settleUntil = 0
    const settle = () => {
      settleUntil = performance.now() + 400
    }
    const onScroll = () => {
      if (performance.now() > settleUntil) atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 8
    }
    const observer = new ResizeObserver(() => {
      settle()
      box.style.setProperty('--composer-h', `${form.offsetHeight}px`)
      if (atEnd) end.current?.scrollIntoView({ block: 'end' })
    })
    list.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('resize', settle)
    window.addEventListener('resize', settle)
    observer.observe(form)
    observer.observe(list)
    return () => {
      observer.disconnect()
      list.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('resize', settle)
      window.removeEventListener('resize', settle)
    }
  }, [])

  // Grow the composer with its text where CSS `field-sizing` isn't supported yet (the CSS caps the height).
  useEffect(() => {
    const el = input.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [draft])

  async function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
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

  return (
    <div className="chat" ref={chat}>
      <div className="messages" role="log" aria-busy={busy || !loaded}>
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
          <p className="bubble assistant">{t.chat.welcome}</p>
        )}
        {bubbles.map((bubble, i) =>
          bubble.text ? (
            <p key={i} className={`bubble ${bubble.role}${i >= settled ? ' fresh' : ''}`}>
              {bubble.text}
            </p>
          ) : (
            // The reply's first words haven't arrived yet.
            <p key={i} className="bubble assistant typing fresh">
              <Mark size={26} animated />
              <span className="sr-only">{t.chat.typing}</span>
            </p>
          ),
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
          // Keep focus (and the phone keyboard) in the textarea: a blur here would bring the tab bar back
          // mid-tap, shift the button out from under the finger and lose the click.
          onMouseDown={(e) => e.preventDefault()}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  )
}
