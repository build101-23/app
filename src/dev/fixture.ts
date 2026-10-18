// Dev-only stand-in for ./supabase. `npm run dev:fixture` aliases it in (vite.config.ts) so the signed-in
// screens can be reviewed without a real account. Everything here is synthetic. The production build never
// imports this file. Scenarios come from the query string; see docs/development.md.
import type { Session } from '@supabase/supabase-js'
import type { MenuData } from '../../supabase/functions/_shared/menu.ts'

const params = new URLSearchParams(window.location.search)
const scenario = (key: string, fallback: string) => params.get(key) ?? fallback
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const never = () => new Promise<never>(() => {})
const failure = { data: null, error: { message: 'fixture error' } }

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

type Row = { role: 'user' | 'assistant'; content: Record<string, unknown>[] }
const text = (role: Row['role'], value: string): Row => ({ role, content: [{ type: 'text', text: value }] })

// A week with few recipes that repeat, as the product asks, all from the food catalog.
const week: MenuData = {
  recipes: [
    {
      id: 'avena',
      name: 'Avena con banana',
      how: 'Calentá la leche, sumá la avena y cociná 3 minutos. Servila con la banana en rodajas.',
      ingredients: [
        { food: 'oats', other_name: null, amount: 50, unit: 'g' },
        { food: 'milk', other_name: null, amount: 200, unit: 'ml' },
        { food: 'banana', other_name: null, amount: 120, unit: 'g' },
      ],
    },
    {
      id: 'pollo',
      name: 'Pollo al horno con boniato',
      how: 'Horneá el pollo y el boniato en cubos con aceite y ajo, 35 minutos a 200 °C.',
      ingredients: [
        { food: 'chicken_breast', other_name: null, amount: 180, unit: 'g' },
        { food: 'sweet_potato', other_name: null, amount: 250, unit: 'g' },
        { food: 'olive_oil', other_name: null, amount: 10, unit: 'ml' },
        { food: 'garlic', other_name: null, amount: 5, unit: 'g' },
      ],
    },
    {
      id: 'garbanzos',
      name: 'Ensalada de garbanzos',
      how: 'Mezclá los garbanzos cocidos con tomate, cebolla y lechuga. Aderezá con aceite y limón.',
      ingredients: [
        { food: 'chickpeas', other_name: null, amount: 80, unit: 'g' },
        { food: 'tomato', other_name: null, amount: 150, unit: 'g' },
        { food: 'onion', other_name: null, amount: 50, unit: 'g' },
        { food: 'lettuce', other_name: null, amount: 0.25, unit: 'un' },
        { food: 'lemon', other_name: null, amount: 30, unit: 'g' },
      ],
    },
    {
      id: 'yogur',
      name: 'Yogur con maní',
      how: 'Serví el yogur con el maní picado.',
      ingredients: [
        { food: 'yogurt', other_name: null, amount: 200, unit: 'g' },
        { food: 'peanuts', other_name: null, amount: 30, unit: 'g' },
      ],
    },
    {
      id: 'pizza',
      name: 'Pizza casera sin gluten',
      how: 'Cubrí la prepizza con tomate y queso, y horneá 12 minutos.',
      ingredients: [
        { food: 'other', other_name: 'Prepizza sin gluten', amount: 1, unit: 'un' },
        { food: 'crushed_tomato', other_name: null, amount: 100, unit: 'g' },
        { food: 'cheese', other_name: null, amount: 120, unit: 'g' },
      ],
    },
  ],
  days: (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day, i) => ({
    day,
    meals: [
      { slot: 'Desayuno', recipe_id: 'avena' },
      { slot: 'Almuerzo', recipe_id: i % 2 ? 'garbanzos' : 'pollo' },
      { slot: 'Merienda', recipe_id: 'yogur' },
      { slot: 'Cena', recipe_id: day === 'friday' ? 'pizza' : i % 2 ? 'pollo' : 'garbanzos' },
    ],
  })),
}

const longChat: Row[] = [
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
    'Anotado: nada de pescado ni gluten, más pollo y avena, y pizza los viernes. Lo guardé en tu perfil.\n\nUna pregunta más sobre la cena: ¿preferís algo que puedas dejar listo el domingo y calentar, o cocinar en el momento? Las dos opciones entran en tu media hora, pero cambian bastante cómo se arma la semana. Contame qué te resulta más cómodo y seguimos por ahí.',
  ),
  text(
    'user',
    'Te paso la receta que vi: https://ejemplo.com/recetas/pollo-al-horno-con-boniato-y-especias-version-sin-gluten-para-toda-la-semana',
  ),
  text('assistant', 'Buenísima: rinde para varias cenas y entra en tu media hora. ¿Te armo la semana con eso?'),
  text('user', 'Dale, armame la semana.'),
  {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Te armé una semana con pocas recetas que se repiten, para que la lista sea corta.' },
      { type: 'tool_use', id: 'toolu_fixture_menu', name: 'save_menu', input: week },
    ],
  },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_fixture_menu', content: 'saved' }] },
  text('assistant', 'Miralo en Menú. Si querés cambiar algo, decime.'),
  text('user', '¿Me pasás la lista de compras?'),
  {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Acá está, con lo que ya tenés en casa tachado.' },
      { type: 'tool_use', id: 'toolu_fixture_list', name: 'show_shopping_list', input: {} },
    ],
  },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_fixture_list', content: 'shown' }] },
]

const messages = new Map<string, Row[]>([
  ['c1', longChat],
  [
    'c2',
    [
      text('user', 'Ideas para cenas sin gluten que pueda dejar listas.'),
      text('assistant', 'Tres que funcionan bien: tarta de zapallitos con base de arroz, guiso de lentejas y pollo al horno.'),
    ],
  ],
  [
    'c3',
    [
      text('user', 'Mi nutricionista me pidió más legumbres.'),
      text('assistant', 'Perfecto, las sumo dos veces por semana sin cambiar el resto de tu plan.'),
    ],
  ],
])

let conversations =
  scenario('chat', 'long') === 'empty'
    ? []
    : [
        { id: 'c1', title: 'Hola, quiero comer más ordenado entre semana.', updated_at: '2026-10-17T18:20:00Z' },
        { id: 'c2', title: 'Ideas para cenas sin gluten', updated_at: '2026-10-15T21:05:00Z' },
        { id: 'c3', title: 'Mi nutricionista me pidió más legumbres.', updated_at: '2026-10-12T10:40:00Z' },
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
  // numbers=on starts with the numbers switch on.
  show_numbers: scenario('numbers', 'off') === 'on',
}

// menu: saved (default), none, error. One item starts crossed out on the list.
const menuMode = scenario('menu', 'saved')
const menuRow = {
  data: week,
  have: { banana: null } as Record<string, number | null>,
  updated_at: '2026-10-17T18:25:00Z',
}

type Filters = Record<string, unknown>

// Answers the few query shapes the app uses, after a short delay, as a thenable like supabase-js.
class Query {
  private filters: Filters = {}
  private op: 'select' | 'insert' | 'update' = 'select'
  private payload: Record<string, unknown> = {}
  private returning = false
  private table: string

  constructor(table: string) {
    this.table = table
  }

  select(_columns?: string) {
    if (this.op !== 'select') this.returning = true
    return this
  }
  insert(values: Record<string, unknown>) {
    this.op = 'insert'
    this.payload = values
    return this
  }
  update(values: Record<string, unknown>) {
    this.op = 'update'
    this.payload = values
    return this
  }
  eq(column: string, value: unknown) {
    this.filters[column] = value
    return this
  }
  order(_column: string, _options?: unknown) {
    return this
  }
  maybeSingle() {
    return this
  }
  single() {
    return this
  }

  then<A, B>(resolve: (value: { data: unknown; error: unknown }) => A, reject?: (reason: unknown) => B) {
    return this.run().then(resolve, reject)
  }

  private async run(): Promise<{ data: unknown; error: unknown }> {
    if (this.op === 'select' && scenario('loading', '') === 'data') return never()
    await wait(this.op === 'select' ? 500 : 300)
    if (this.table === 'conversations') {
      if (this.op === 'insert') {
        const id = `c${conversations.length + 1}-${Math.round(performance.now())}`
        conversations = [{ id, title: String(this.payload.title), updated_at: new Date().toISOString() }, ...conversations]
        messages.set(id, [])
        return { data: { id }, error: null }
      }
      return scenario('chat', 'long') === 'error' ? failure : { data: conversations, error: null }
    }
    if (this.table === 'messages') {
      return { data: messages.get(String(this.filters.conversation_id)) ?? [], error: null }
    }
    if (this.table === 'menus') {
      if (menuMode === 'error') return failure
      if (this.op === 'update') {
        Object.assign(menuRow, this.payload)
        return { data: this.returning ? [{ updated_at: menuRow.updated_at }] : null, error: null }
      }
      return { data: menuMode === 'none' ? null : structuredClone(menuRow), error: null }
    }
    const profile = scenario('profile', 'full')
    if (profile === 'error') return failure
    // An empty profile has no row, unless the numbers switch was set: set_show_numbers creates it.
    if (profile === 'empty') {
      return { data: fullProfile.show_numbers ? { data: { show_numbers: true } } : null, error: null }
    }
    return { data: { data: fullProfile }, error: null }
  }
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
    // Google's button hands over an ID token; here any token signs the fixture user in.
    async signInWithIdToken(_credentials: unknown) {
      await wait(400)
      current = session
      listeners.forEach((listener) => listener('SIGNED_IN', session))
      return { error: null }
    },
  },
  from: (table: string) => new Query(table),
  // set_show_numbers: the only function the browser calls (ADR 0021).
  async rpc(name: string, args: { show_numbers?: boolean }) {
    await wait(300)
    // A failed save changes nothing.
    if (scenario('numbers', 'off') === 'error') return { data: null, error: { message: 'fixture error' } }
    if (name === 'set_show_numbers') fullProfile.show_numbers = args.show_numbers === true
    return { data: null, error: null }
  },
}

const reply =
  'Buena elección: el pollo al horno con boniato se puede dejar listo el domingo y rinde para varias cenas.\n\nPara que entre en tu semana:\n- Hacé una bandeja grande y separala en porciones.\n- Sumá una verdura distinta cada día para variar.\n\n¿Querés que lo tengamos en cuenta para tu menú?'

// Stream the chat function's reply the way the real one does: plain text, in chunks. The finished turn is
// stored in its conversation, as the server would, so reloading the messages keeps it.
const realFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!url.includes('/functions/v1/chat')) return realFetch(input, init)
  const mode = scenario('reply', 'ok')
  await wait(mode === 'slow' ? 3000 : 900)
  if (mode === 'error') return new Response('fixture error', { status: 500 })
  if (mode === 'limit') return new Response('fixture limit', { status: 429 })
  const { text: sent, conversation_id } = JSON.parse(String(init?.body ?? '{}'))
  const chunks = reply.match(/[\s\S]{1,14}/g) ?? []
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
        await wait(mode === 'trickle' ? 600 : 45)
      }
      messages.get(conversation_id)?.push(text('user', sent), text('assistant', reply))
      controller.close()
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
