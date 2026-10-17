import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { t } from './strings'

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
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('messages')
      .select('role, content')
      .order('id')
      .then(({ data, error }) => {
        if (error) setError(t.chat.loadError)
        else setBubbles(toBubbles(data))
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
    <div className="chat">
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
      <form onSubmit={send}>
        <textarea
          rows={2}
          value={draft}
          placeholder={t.chat.placeholder}
          aria-label={t.chat.placeholder}
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button disabled={busy || !draft.trim()}>{t.chat.send}</button>
      </form>
    </div>
  )
}
