import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'

type Role = 'user' | 'assistant'
type Bubble = { role: Role; text: string }
type Row = { role: Role; content: { type: string; text?: string }[] }
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

// Only text is shown; thinking, tool calls, tool results and the server's profile copies stay hidden.
const toBubbles = (rows: Row[]): Bubble[] =>
  rows.flatMap((row) => {
    const text = row.content
      .filter((block) => block.type === 'text' && !block.text?.startsWith('<saved_profile>'))
      .map((block) => block.text)
      .join('\n')
    return text ? [{ role: row.role, text }] : []
  })

const day = (iso: string) => new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })

export default function Chat({ session }: { session: Session }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  // null is a new chat that has no row yet: it gets one with its first message.
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
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

  async function open(id: string) {
    setConversationId(id)
    setShowList(false)
    setBubbles([])
    setError('')
    const { data, error } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('id')
    if (error) setError(t.chat.loadError)
    else setBubbles(toBubbles(data))
  }

  function newChat() {
    setConversationId(null)
    setShowList(false)
    setBubbles([])
    setError('')
  }

  // Opens on the most recent chat. State is only set once the queries resolve, which the rule can't see.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadConversations().then((list) => {
      if (list[0]) open(list[0].id)
    })
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
    setError('')
    setDraft('')
    setBubbles((b) => [...b, { role: 'user', text }, { role: 'assistant', text: '' }])
    const setReply = (reply: string) => setBubbles((b) => [...b.slice(0, -1), { role: 'assistant', text: reply }])

    try {
      let id = conversationId
      if (!id) {
        const { data, error } = await supabase
          .from('conversations')
          .insert({ title: text.slice(0, 60) })
          .select('id')
          .single()
        if (error) throw error
        id = data.id
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
      loadConversations()
    } catch {
      // The server stores nothing from a failed turn, so drop both bubbles and give the text back.
      setBubbles((b) => b.slice(0, -2))
      setDraft(text)
      setError(t.chat.error)
    }
    setBusy(false)
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
              <button aria-current={c.id === conversationId ? 'true' : undefined} onClick={() => open(c.id)}>
                <span>{c.title}</span>
                <small>{day(c.updated_at)}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="messages">
          {bubbles.length === 0 && !error && <p className="bubble assistant">{t.chat.welcome}</p>}
          {bubbles.map((bubble, i) => (
            <p key={i} className={`bubble ${bubble.role}`}>
              {bubble.text || '…'}
            </p>
          ))}
          {error && <p role="alert">{error}</p>}
          <div ref={end} />
        </div>
      )}
      <form onSubmit={send}>
        <textarea
          rows={2}
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
