// Dev-only stand-in for ./supabase. `npm run dev:fixture` aliases it in (vite.config.ts) so the signed-in
// screens can be reviewed without a real account. Everything here is synthetic. The production build never
// imports this file. Scenarios come from the query string; see docs/development.md.
import type { Session } from '@supabase/supabase-js'

const params = new URLSearchParams(window.location.search)
const scenario = (key: string, fallback: string) => params.get(key) ?? fallback
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const never = () => new Promise<never>(() => {})

if (params.get('safe') === 'iphone') {
  const root = document.documentElement.style
  root.setProperty('--safe-top', '47px')
  root.setProperty('--safe-bottom', '34px')
}

const session = {
  access_token: 'fixture-token',
  user: { id: 'fixture-user', email: 'persona@ejemplo.com' },
} as unknown as Session

type Listener = (event: string, session: Session | null) => void
const listeners = new Set<Listener>()
let current: Session | null = scenario('auth', 'in') === 'out' ? null : session

const text = (role: 'user' | 'assistant', value: string) => ({ role, content: [{ type: 'text', text: value }] })

const conversation = [
  text('user', 'Hola, quiero comer más ordenado entre semana.'),
  {
    role: 'assistant',
    content: [
      { type: 'thinking', thinking: 'hidden in the UI' },
      { type: 'text', text: 'Buenísimo. Para arrancar: ¿cuántas comidas hacés por día y cuánto tiempo tenés para cocinar?' },
    ],
  },
  text('user', 'Cuatro comidas. Entre semana tengo media hora, como mucho.'),
  text(
    'assistant',
    'Perfecto, media hora alcanza para bastante.\n\nAntes de seguir, contame un poco más:\n- ¿Hay algo que no puedas comer?\n- ¿Algo que no te guste nada?\n- ¿Y algo que te encante y quieras que aparezca seguido?\n\nCon eso armamos una primera idea de la semana y la vamos ajustando.',
  ),
  text('user', 'No como pescado y no puedo comer gluten. Me encantan el pollo y la avena. Y los viernes quiero pizza.'),
  text(
    'assistant',
    'Anotado: nada de pescado ni gluten, más pollo y avena, y pizza los viernes. Lo guardé en tu perfil.\n\nUna pregunta más sobre la cena: ¿preferís algo que puedas dejar listo el domingo y calentar, o cocinar en el momento? Las dos opciones entran en tu media hora, pero cambian bastante cómo se arma la semana. Si cocinás en el momento conviene repetir pocas preparaciones simples; si dejás cosas listas, conviene una o dos preparaciones grandes que rindan varios días. Contame qué te resulta más cómodo y seguimos por ahí.',
  ),
  text(
    'user',
    'Te paso la receta que vi: https://ejemplo.com/recetas/pollo-al-horno-con-boniato-y-especias-version-sin-gluten-para-toda-la-semana',
  ),
]

const fullProfile = {
  goal: 'Comer más ordenado entre semana',
  meals_per_day: 4,
  cooking_time: 'Media hora entre semana',
  follows_nutritionist_plan: true,
  nutritionist_plan_notes:
    'Desayuno con avena, almuerzo con proteína y verduras, merienda liviana y cena temprana. Lo revisa con su nutricionista cada mes.',
  cant_eat: ['gluten', 'pescado'],
  dislike: ['brócoli', 'hígado'],
  like: ['pollo', 'avena', 'zapallo', 'boniato'],
  want: ['pizza los viernes', 'más legumbres'],
}

async function load(table: string) {
  if (scenario('loading', '') === 'data') return never()
  await wait(500)
  if (table === 'messages') {
    const chat = scenario('chat', 'long')
    if (chat === 'error') return { data: null, error: { message: 'fixture error' } }
    return { data: chat === 'empty' ? [] : conversation, error: null }
  }
  const profile = scenario('profile', 'full')
  if (profile === 'error') return { data: null, error: { message: 'fixture error' } }
  return { data: profile === 'empty' ? null : { data: fullProfile }, error: null }
}

export const supabase = {
  auth: {
    async getSession() {
      if (scenario('loading', '') === 'session') return never()
      return { data: { session: current } }
    },
    onAuthStateChange(listener: Listener) {
      listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }
    },
    async signInWithOtp(_options: unknown) {
      const otp = scenario('otp', 'ok')
      await wait(otp === 'slow' ? 4000 : 800)
      return { error: otp === 'error' ? { message: 'Email rate limit exceeded' } : null }
    },
    async signOut() {
      current = null
      listeners.forEach((listener) => listener('SIGNED_OUT', null))
      return { error: null }
    },
  },
  from(table: string) {
    return {
      select: (_columns: string) => ({ order: (_column: string) => load(table), maybeSingle: () => load(table) }),
    }
  },
}

const reply =
  'Buena elección: el pollo al horno con boniato se puede dejar listo el domingo y rinde para varias cenas.\n\nPara que entre en tu semana:\n- Hacé una bandeja grande y separala en porciones.\n- Sumá una verdura distinta cada día para variar.\n\n¿Querés que lo tengamos en cuenta para tu menú?'

// Stream the chat function's reply the way the real one does: plain text, in chunks.
const realFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!url.includes('/functions/v1/chat')) return realFetch(input, init)
  const mode = scenario('reply', 'ok')
  await wait(mode === 'slow' ? 3000 : 900)
  if (mode === 'error') return new Response('fixture error', { status: 500 })
  const chunks = reply.match(/[\s\S]{1,14}/g) ?? []
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
        await wait(mode === 'trickle' ? 600 : 45)
      }
      controller.close()
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
