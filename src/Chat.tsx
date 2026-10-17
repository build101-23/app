import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { supabase } from './supabase'
import { t } from './strings'
import { MenuPreview } from './Menu'
import { ListPreview, type MenuRow } from './List'

type Role = 'user' | 'assistant'
// turn: counts the user's messages, so a turn's cards can be found. saved: a menu card from a save_menu call.
type Bubble = { role: Role; text: string; menu?: MenuData; saved?: boolean; list?: true; turn: number }
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

// Shows text, plus a preview after each save_menu call that saved and the turn's first show_menu call, and the list
// card. Thinking, other tool calls, tool results and the server's profile and menu copies stay hidden.
function toBubbles(rows: Row[]): Bubble[] {
  const saved = new Set(
    rows
      .flatMap((row) => row.content)
      .flatMap((block) => (block.type === 'tool_result' && !block.is_error ? [block.tool_use_id] : [])),
  )
  // The menu as it stood at each point of the chat: the server adds its copy whenever the saved one changed.
  let latest: MenuData | undefined
  // The model may call show_menu right after save_menu, or twice: one card per turn is enough.
  let shown = false
  let turn = 0
  const bubbles = rows.flatMap((row) => {
    const text = row.content
      .filter((block) => block.type === 'text' && !block.text?.startsWith('<saved_'))
      .map((block) => block.text)
      .join('\n')
    if (row.role === 'user' && text) {
      shown = false
      turn++
    }
    const cards: Bubble[] = []
    for (const block of row.content) {
      if (block.text?.startsWith('<saved_menu>')) {
        latest = JSON.parse(block.text.slice('<saved_menu>'.length, -'</saved_menu>'.length))
      }
      const savedMenu = block.name === 'save_menu' && saved.has(block.id)
      if (savedMenu) latest = block.input as MenuData
      if (savedMenu || (block.name === 'show_menu' && latest && !shown)) {
        cards.push({ role: row.role, text: '', menu: latest, saved: savedMenu, turn })
        shown = true
      }
      if ((block.name === 'show_shopping_list' || block.name === 'update_shopping_list') && saved.has(block.id)) {
        cards.push({ role: row.role, text: '', list: true, turn })
      }
    }
    return [...(text ? [{ role: row.role, text, turn }] : []), ...cards]
  })
  // The list card is live, drawn from the saved menu, so only the last one shows: older ones would repeat it. Once the
  // list has been shown, a turn that shows it again hides the menus it saved: the menu changed in the background, and
  // the reply says so. The first turn keeps them, as the model may show a new menu and its list together.
  const listTurns = bubbles.filter((bubble) => bubble.list).map((bubble) => bubble.turn)
  const last = bubbles.findLastIndex((bubble) => bubble.list)
  return bubbles.filter((bubble, i) =>
    bubble.list ? i === last : !(bubble.saved && bubble.turn !== listTurns[0] && listTurns.includes(bubble.turn)),
  )
}

const day = (iso: string) => new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })

export default function Chat({
  session,
  initialDraft,
  onBusy,
  onOpenMenu,
  onOpenList,
}: {
  session: Session
  initialDraft: string
  onBusy: (busy: boolean) => void
  onOpenMenu: () => void
  onOpenList: () => void
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  // null is a new chat that has no row yet: it gets one with its first message.
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  // The saved menu and marks, for the live list card. null when there's no menu.
  const [menuRow, setMenuRow] = useState<MenuRow | null>(null)
  const [draft, setDraft] = useState(initialDraft)
  // Starts true: sending waits until the latest chat is open (the effect below).
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const end = useRef<HTMLDivElement>(null)
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
    setError('')
    setBusy(true)
    return loadMessages(id).finally(() => setBusy(false))
  }

  async function loadMessages(id: string) {
    const [{ data, error }, { data: menu, error: menuError }] = await Promise.all([
      supabase.from('messages').select('role, content').eq('conversation_id', id).order('id'),
      supabase.from('menus').select('data, have, updated_at').maybeSingle(),
    ])
    if (error || menuError) setError(t.chat.loadError)
    else {
      setBubbles(toBubbles(data))
      setMenuRow(menu)
    }
  }

  function newChat() {
    setConversationId(null)
    setShowList(false)
    setBubbles([])
    setError('')
  }

  // Opens on the most recent chat. A message sent before that would start a new chat that this then switches
  // away from, so sending unlocks only here. State is only set once the queries resolve, which the rule can't see.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadConversations()
      .then((list) => list[0] && open(list[0].id))
      .finally(() => setBusy(false))
  }, [])

  // Braces matter: newer browsers return a Promise from scrollIntoView, and an effect may only return a cleanup.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [bubbles])

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
    // turn only matters for cards, which come with the reload below.
    setBubbles((b) => [...b, { role: 'user', text, turn: 0 }, { role: 'assistant', text: '', turn: 0 }])
    const setReply = (reply: string) =>
      setBubbles((b) => [...b.slice(0, -1), { role: 'assistant', text: reply, turn: 0 }])

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
      // The stream is text only: the stored turn also has the save_menu and list calls, for the cards. A clean end
      // means the turn was stored, even with no text. Awaited while the box is locked, so it can't overwrite the next
      // message's bubbles.
      await loadMessages(id)
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
    <div className="chat">
      <div className="chat-bar">
        <button className="link" disabled={busy} onClick={() => setShowList(!showList)}>
          {showList ? t.chat.back : t.chat.chats}
        </button>
        <button className="link" disabled={busy} onClick={newChat}>
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
        <div className="messages">
          {bubbles.length === 0 && !error && <p className="bubble assistant">{t.chat.welcome}</p>}
          {bubbles.map((bubble, i) =>
            bubble.list ? (
              menuRow && <ListPreview key={i} row={menuRow} busy={busy} onOpen={onOpenList} />
            ) : bubble.menu ? (
              <MenuPreview key={i} menu={bubble.menu} busy={busy} onOpen={onOpenMenu} />
            ) : (
              <p key={i} className={`bubble ${bubble.role}`}>
                {bubble.text || '…'}
              </p>
            ),
          )}
          {error && <p role="alert">{error}</p>}
          <div ref={end} />
        </div>
      )}
      <form onSubmit={send}>
        <textarea
          rows={2}
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
        <button disabled={busy || !draft.trim()}>{t.chat.send}</button>
      </form>
    </div>
  )
}
