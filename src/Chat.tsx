import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { supabase } from './supabase'
import { t } from './strings'
import { MenuPreview } from './Menu'
import { AlertIcon, Mark, SendIcon } from './ui'

type Role = 'user' | 'assistant'
type Bubble = { role: Role; text: string; menu?: MenuData }
type Block = {
  type: string
  text?: string
  id?: string
  name?: string
  input?: unknown
  tool_use_id?: string
  is_error?: boolean
}
type Row = { role: Role; content: Block[] }
type Conversation = { id: string; title: string; updated_at: string }

// lib.dom has the speech events but not the recognizer itself; only the fields used here.
type Recognizer = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (e: SpeechRecognitionEvent) => void
  onerror: (e: SpeechRecognitionErrorEvent) => void
  onend: () => void
  start: () => void
  stop: () => void
}
declare global {
  interface Window {
    SpeechRecognition?: new () => Recognizer
    webkitSpeechRecognition?: new () => Recognizer
  }
}
// Missing in Firefox and some installed iPhone apps: there the keyboard's dictation still works.
const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition

// Shows text, plus a preview after each save_menu call that saved and each show_menu call. Thinking, other
// tool calls, tool results and the server's profile and menu copies stay hidden.
function toBubbles(rows: Row[]): Bubble[] {
  const saved = new Set(
    rows
      .flatMap((row) => row.content)
      .flatMap((block) => (block.type === 'tool_result' && !block.is_error ? [block.tool_use_id] : [])),
  )
  // The menu as it stood at each point of the chat: the server adds its copy whenever the saved one changed.
  let latest: MenuData | undefined
  return rows.flatMap((row) => {
    const text = row.content
      .filter((block) => block.type === 'text' && !block.text?.startsWith('<saved_'))
      .map((block) => block.text)
      .join('\n')
    const menus: Bubble[] = []
    for (const block of row.content) {
      if (block.text?.startsWith('<saved_menu>')) {
        latest = JSON.parse(block.text.slice('<saved_menu>'.length, -'</saved_menu>'.length))
      }
      const savedMenu = block.name === 'save_menu' && saved.has(block.id)
      if (savedMenu) latest = block.input as MenuData
      if (savedMenu || (block.name === 'show_menu' && latest)) menus.push({ role: row.role, text: '', menu: latest })
    }
    return [...(text ? [{ role: row.role, text }] : []), ...menus]
  })
}

const day = (iso: string) => new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })

export default function Chat({
  session,
  initialDraft,
  onBusy,
  onOpenMenu,
}: {
  session: Session
  initialDraft: string
  onBusy: (busy: boolean) => void
  onOpenMenu: () => void
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  // null is a new chat that has no row yet: it gets one with its first message.
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [loaded, setLoaded] = useState(false)
  // Messages loaded with the history; later ones are new and animate in.
  const [settled, setSettled] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState(initialDraft)
  // Starts true: sending waits until the latest chat is open (the effect below).
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const chat = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLFormElement>(null)
  const recognizer = useRef<Recognizer | null>(null)

  // Leaving the screen must not leave the mic on.
  useEffect(() => () => recognizer.current?.stop(), [])

  function toggleListening() {
    if (recognizer.current) return recognizer.current.stop()
    if (!Recognition) return
    const before = draft.trim()
    const r = new Recognition()
    r.lang = 'es-UY'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      const heard = Array.from(e.results, (result) => result[0].transcript).join('')
      setDraft([before, heard.trim()].filter(Boolean).join(' '))
    }
    r.onerror = (e) => {
      // Stopping on purpose reports "aborted"; silence reports "no-speech". Neither is worth a message.
      if (e.error !== 'aborted' && e.error !== 'no-speech') setError(t.chat.micError)
    }
    r.onend = () => {
      recognizer.current = null
      setListening(false)
    }
    recognizer.current = r
    setError('')
    setListening(true)
    r.start()
  }

  async function loadConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
    if (error) setError(t.chat.loadError)
    else setConversations(data)
    return data ?? []
  }

  // Sending waits for the messages, so they can't land over the new message's bubbles.
  function open(id: string) {
    setConversationId(id)
    setShowList(false)
    setBubbles([])
    setSettled(0)
    setError('')
    setLoadFailed(false)
    setLoaded(false)
    setBusy(true)
    return loadMessages(id).finally(() => {
      setLoaded(true)
      setBusy(false)
    })
  }

  async function loadMessages(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('id')
    setLoadFailed(!!error)
    if (!error) {
      const history = toBubbles(data)
      setBubbles(history)
      setSettled(history.length)
    }
  }

  function newChat() {
    setConversationId(null)
    setShowList(false)
    setBubbles([])
    setSettled(0)
    setError('')
    setLoadFailed(false)
  }

  // Opens on the most recent chat. A message sent before that would start a new chat that this then switches
  // away from, so sending unlocks only here.
  function start() {
    setLoaded(false)
    setLoadFailed(false)
    setBusy(true)
    return loadConversations()
      .then((list) => list[0] && open(list[0].id))
      .finally(() => {
        setLoaded(true)
        setBusy(false)
      })
  }

  function retry() {
    if (conversationId) open(conversationId)
    else start()
  }

  // State is only set once the queries resolve, which the rule can't see.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    start()
  }, [])

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
    const list = box?.querySelector('.messages, .chats')
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
  }, [showList])

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
    // stop() still delivers the last results, which would refill the box we're about to clear.
    if (recognizer.current) {
      recognizer.current.onresult = () => {}
      recognizer.current.stop()
    }
    setBusy(true)
    onBusy(true)
    setError('')
    setDraft('')
    setBubbles((b) => [...b, { role: 'user', text }, { role: 'assistant', text: '' }])
    const setReply = (reply: string) => setBubbles((b) => [...b.slice(0, -1), { role: 'assistant', text: reply }])

    let failure = t.chat.error
    try {
      let id = conversationId
      if (!id) {
        const { data, error } = await supabase
          .from('conversations')
          .insert({ title: text.slice(0, 60) })
          .select('id')
          .single()
        if (error) throw error
        id = data.id as string
        // Kept even if the reply fails, so a retry goes to the same chat.
        setConversationId(id)
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, conversation_id: id }),
        // Above the function's 150 s wall clock: a stalled connection must not keep the tabs locked.
        signal: AbortSignal.timeout(200_000),
      })
      if (res.status === 429) failure = t.chat.limit
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
      // The stream is text only: the stored turn also has the save_menu calls, for the preview.
      // Awaited while the box is locked, so it can't overwrite the next message's bubbles.
      if (reply) await loadMessages(id)
      loadConversations()
    } catch {
      // The server stores nothing from a failed turn, so drop both bubbles and give the text back.
      setBubbles((b) => b.slice(0, -2))
      setDraft(text)
      setError(failure)
    }
    setBusy(false)
    onBusy(false)
  }

  return (
    <div className="chat" ref={chat}>
      <div className="chat-bar">
        <button type="button" className="button quiet" disabled={busy} onClick={() => setShowList(!showList)}>
          {showList ? t.chat.back : t.chat.chats}
        </button>
        <button type="button" className="button quiet" disabled={busy} onClick={newChat}>
          {t.chat.newChat}
        </button>
      </div>
      {showList ? (
        <ul className="chats">
          {conversations.length === 0 && <li className="muted">{t.chat.noChats}</li>}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                aria-current={c.id === conversationId ? 'true' : undefined}
                disabled={busy}
                onClick={() => open(c.id)}
              >
                <span>{c.title}</span>
                <small>{day(c.updated_at)}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : (
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
            bubble.menu ? (
              <MenuPreview key={i} menu={bubble.menu} busy={busy} onOpen={onOpenMenu} />
            ) : bubble.text ? (
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
      )}
      <form className="composer" ref={composer} onSubmit={send}>
        <textarea
          ref={input}
          rows={1}
          autoFocus={!!initialDraft}
          value={draft}
          placeholder={t.chat.placeholder}
          aria-label={t.chat.placeholder}
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }}
        />
        {Recognition && (
          <button
            type="button"
            className={listening ? 'mic listening' : 'mic'}
            aria-label={listening ? t.chat.stopListening : t.chat.listen}
            aria-pressed={listening}
            onClick={toggleListening}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              {listening ? (
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              ) : (
                <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </g>
              )}
            </svg>
          </button>
        )}
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
