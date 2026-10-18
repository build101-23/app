import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { t } from './strings'
import { Alert } from './ui'

// Google Identity Services, only the parts we call.
type Gsi = {
  initialize(config: {
    client_id: string
    nonce: string
    callback: (response: { credential: string }) => void
  }): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
}

declare global {
  interface Window {
    google?: { accounts: { id: Gsi } }
  }
}

const clientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

let script: Promise<Gsi> | undefined

function loadGsi() {
  script ??= new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = 'https://accounts.google.com/gsi/client'
    el.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('gsi')))
    el.onerror = () => {
      script = undefined
      el.remove()
      reject(new Error('gsi'))
    }
    document.head.append(el)
  })
  return script
}

// Google signs the hash into the ID token and Supabase checks it against the raw value, so a stolen token can't be replayed.
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return { raw, hashed }
}

// Google's own button returns an ID token to this page, so sign-in never leaves an installed iOS app the way a redirect or magic link does.
export default function GoogleSignIn() {
  const button = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientId) return
    let cancelled = false

    Promise.all([loadGsi(), makeNonce()])
      .then(([gsi, nonce]) => {
        const el = button.current
        if (cancelled || !el) return
        gsi.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          callback: async ({ credential }) => {
            setError('')
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: credential,
              nonce: nonce.raw,
            })
            if (error) setError(t.signIn.googleError)
          },
        })
        gsi.renderButton(el, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: Math.min(400, el.offsetWidth),
          locale: 'es-419',
        })
      })
      .catch(() => {
        if (!cancelled) setError(t.signIn.googleError)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!clientId) return null
  return (
    <div className="google">
      <div ref={button} className="google-button" />
      {error && <Alert text={error} />}
      <p className="divider">{t.signIn.orEmail}</p>
    </div>
  )
}
