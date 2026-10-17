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

// Stand-in for Google Identity Services: a plainly labeled button that "signs in" with a fake ID token, so the
// real Google script never loads in the fixture. ?google=error makes Supabase reject the token;
// ?google=unreachable makes the button fail to render, as if Google's script couldn't load.
let googleCallback: ((response: { credential: string }) => void) | undefined
window.google = {
  accounts: {
    id: {
      initialize(config) {
        googleCallback = config.callback
      },
      renderButton(parent) {
        if (scenario('google', 'ok') === 'unreachable') throw new Error('gsi')
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'fixture-google'
        button.textContent = 'Continuar con Google (simulado)'
        button.addEventListener('click', () => googleCallback?.({ credential: 'fixture-id-token' }))
        parent.replaceChildren(button)
      },
    },
  },
}
const fixtureStyle = document.createElement('style')
fixtureStyle.textContent = `.fixture-google { width: 100%; max-width: 400px; min-height: 44px; border: 1px dashed currentColor;
  border-radius: 999px; background: var(--surface); color: var(--ink); font: 600 0.9375rem/1 var(--font); }`
document.head.append(fixtureStyle)

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

const ingredient = (food: string, amount: number, unit: string) => ({ food, other_name: null, amount, unit })
const menuData = {
  recipes: [
    {
      id: 'oats',
      name: 'Avena con banana',
      how: 'Cociná la avena en la leche 5 minutos y sumá la banana en rodajas.',
      ingredients: [ingredient('oats', 50, 'g'), ingredient('milk', 200, 'ml'), ingredient('banana', 120, 'g')],
    },
    {
      id: 'chicken',
      name: 'Pollo al horno con boniato',
      how: 'Horneá el pollo y el boniato en cubos 35 minutos a 200 °C.',
      ingredients: [
        ingredient('chicken_breast', 180, 'g'),
        ingredient('sweet_potato', 200, 'g'),
        ingredient('olive_oil', 10, 'ml'),
      ],
    },
    {
      id: 'lentils',
      name: 'Guiso de lentejas',
      how: 'Rehogá cebolla y zanahoria, sumá las lentejas y el tomate, y cociná 25 minutos.',
      ingredients: [
        ingredient('lentils', 80, 'g'),
        ingredient('onion', 60, 'g'),
        ingredient('carrot', 60, 'g'),
        ingredient('crushed_tomato', 100, 'g'),
      ],
    },
    {
      id: 'yogurt',
      name: 'Yogur con manzana',
      how: 'Cortá la manzana y servila con el yogur.',
      ingredients: [ingredient('yogurt', 170, 'g'), ingredient('apple', 150, 'g')],
    },
  ],
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, i) => ({
    day,
    meals: [
      { slot: 'Desayuno', recipe_id: 'oats' },
      { slot: 'Almuerzo', recipe_id: i % 2 ? 'lentils' : 'chicken' },
      { slot: 'Merienda', recipe_id: 'yogurt' },
      { slot: 'Cena', recipe_id: i % 2 ? 'chicken' : 'lentils' },
    ],
  })),
}

// A saved menu at the end of the sample chat: the chat shows it as a menu card under the reply.
const menuTurn = [
  {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Listo, armé tu semana con el pollo al horno y un guiso de lentejas.' },
      { type: 'tool_use', id: 'save-1', name: 'save_menu', input: menuData },
    ],
  },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'save-1' }] },
]

const updatedAt = '2026-10-17T12:00:00Z'
const conversations = [
  { id: 'c1', title: 'Hola, quiero comer más ordenado entre semana.', updated_at: updatedAt },
  { id: 'c2', title: 'Ideas de meriendas sin gluten', updated_at: '2026-10-15T18:30:00Z' },
]

// The menu row both Menu and List read. ?menu=draft leaves it unconfirmed, ?menu=none has no menu yet.
let menuRow: Record<string, unknown> | null =
  scenario('menu', 'confirmed') === 'none'
    ? null
    : {
        data: menuData,
        confirmed_at: scenario('menu', 'confirmed') === 'draft' ? null : updatedAt,
        have: { oats: 100 },
        updated_at: updatedAt,
      }

async function load(table: string) {
  if (scenario('loading', '') === 'data') return never()
  await wait(500)
  if (table === 'conversations') {
    return { data: scenario('chat', 'long') === 'empty' ? [] : conversations, error: null }
  }
  if (table === 'messages') {
    const chat = scenario('chat', 'long')
    if (chat === 'error') return { data: null, error: { message: 'fixture error' } }
    return { data: chat === 'empty' ? [] : [...conversation, ...menuTurn], error: null }
  }
  if (table === 'menus') return { data: menuRow, error: null }
  const profile = scenario('profile', 'full')
  if (profile === 'error') return { data: null, error: { message: 'fixture error' } }
  return { data: profile === 'empty' ? null : { data: fullProfile }, error: null }
}

// What the screens write: a new chat's row, the menu's confirmation and what you have at home.
function write(table: string, values: Record<string, unknown>) {
  if (table === 'menus' && menuRow) menuRow = { ...menuRow, ...values }
  const done = Promise.resolve({ data: [{ updated_at: updatedAt }], error: null })
  const chain = {
    eq: () => chain,
    select: () => ({ single: () => Promise.resolve({ data: { id: `c${Date.now()}` }, error: null }), then: done.then.bind(done) }),
    then: done.then.bind(done),
  }
  return chain
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
    async signInWithIdToken(_credentials: unknown) {
      await wait(600)
      if (scenario('google', 'ok') === 'error') return { data: null, error: { message: 'Invalid ID token' } }
      current = session
      listeners.forEach((listener) => listener('SIGNED_IN', session))
      return { data: { session }, error: null }
    },
    async signOut() {
      current = null
      listeners.forEach((listener) => listener('SIGNED_OUT', null))
      return { error: null }
    },
  },
  from(table: string) {
    const query = {
      eq: (_column: string, _value: unknown) => query,
      order: (_column: string, _options?: unknown) => load(table),
      maybeSingle: () => load(table),
    }
    return {
      select: (_columns: string) => query,
      insert: (values: Record<string, unknown>) => write(table, values),
      update: (values: Record<string, unknown>) => write(table, values),
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
        await wait(45)
      }
      controller.close()
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
