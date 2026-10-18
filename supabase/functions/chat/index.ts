import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { catalog, type CatalogKey } from '../_shared/catalog.ts'
import { buildList, itemId, listLines, type Have } from '../_shared/list.ts'
import { days, foodProblems, menuProblems, menuShapeProblems, type Ingredient, type MenuData } from '../_shared/menu.ts'
import { nutritionText } from '../_shared/nutrition.ts'
import { pricing, verdict } from '../_shared/offers.ts'
import {
  freshRows,
  productColumns,
  productProblems,
  searchText,
  skusByStore,
  type Newest,
  type ProductRow,
  type SearchRow,
} from '../_shared/products.ts'
import { MAX_REPEAT_DAYS, nextOrder, todayInMontevideo } from '../_shared/repeat.ts'
import { stores } from '../_shared/stores.ts'
import { MENU_TAG, PROFILE_TAG, REPEAT_TAG, SYSTEM_PROMPT, TODAY_TAG } from './prompt.ts'

type MessageParam = Anthropic.Beta.BetaMessageParam

const anthropic = new Anthropic() // reads the ANTHROPIC_API_KEY secret

// Users can only read their rows (ADR 0014), so this function writes with the service role. It skips
// row-level security: every write names its user_id, or a conversation the user's own client found.
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const DAILY_TURNS = 100
// Model calls per turn: searching, saving and replying, with room to fix a save.
const ROUNDS = 6

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
}

const nullable = (type: string) => ({ type: [type, 'null'] })
const list = { type: 'array', items: { type: 'string' } }

// Small input, so no eager input streaming: strict keeps the server validating it.
const saveProfile: Anthropic.Beta.BetaTool = {
  name: 'save_profile',
  description:
    "Save the user's complete profile. Each call replaces the saved profile, so always send every field and every item, including unchanged ones.",
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      goal: nullable('string'),
      meals_per_day: nullable('integer'),
      cooking_time: nullable('string'),
      follows_nutritionist_plan: nullable('boolean'),
      nutritionist_plan_notes: nullable('string'),
      cant_eat: list,
      dislike: list,
      like: list,
      want: list,
      show_numbers: {
        ...nullable('boolean'),
        description: 'The numbers switch. null: never set (numbers hidden). true: show calories and macros. false: the user turned them off.',
      },
    },
    required: [
      'goal',
      'meals_per_day',
      'cooking_time',
      'follows_nutritionist_plan',
      'nutritionist_plan_notes',
      'cant_eat',
      'dislike',
      'like',
      'want',
      'show_numbers',
    ],
    additionalProperties: false,
  },
}

const object = (properties: Record<string, unknown>) => ({
  type: 'object' as const,
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})

// A few recipes that repeat, referenced by id from the days, and the product picked for each food at each store from
// search_products (ADR 0024). Recipes come first so they're written before the days that point at them. Not strict:
// with the products its grammar went over the API's cap (400). menuShapeProblems checks the shape, menuProblems the
// ids, units and days' order (../_shared/menu.ts), productProblems the skus (../_shared/products.ts).
const saveMenu: Anthropic.Beta.BetaTool = {
  name: 'save_menu',
  description:
    "Save the user's menu: the days they asked for (1 to 7, a week unless they asked for fewer), the recipes, the budget and the products picked from search_products. Each call replaces the saved menu, so always send all of it. The answer gives the real price of the shopping list.",
  input_schema: object({
    recipes: {
      type: 'array',
      items: object({
        id: { type: 'string' },
        name: { type: 'string' },
        how: { type: 'string', description: 'One line of instructions.' },
        ingredients: {
          type: 'array',
          items: object({
            food: {
              type: 'string',
              enum: [...Object.keys(catalog), 'other'],
              description: `A catalog food, or 'other' for anything else. Catalog foods, their units and what they contain (the Menu tab adds these up):\n${Object.entries(
                catalog,
              )
                .map(([key, food]) => `${key} (${food.unit}; ${nutritionText(key as CatalogKey)})`)
                .join('\n')}`,
            },
            other_name: { ...nullable('string'), description: "The food's name when food is 'other', otherwise null." },
            amount: { type: 'number', description: 'Per serving, raw as bought, in unit.' },
            unit: {
              type: 'string',
              enum: ['g', 'ml', 'un'],
              description: "The catalog food's unit. For 'other', the unit it's measured in.",
            },
          }),
        },
      }),
    },
    days: {
      type: 'array',
      description:
        'In calendar order from the first day, each once (saturday, sunday, monday); only the days the user asked for, a week if they did not say.',
      items: object({
        day: { type: 'string', enum: [...days] },
        meals: { type: 'array', items: object({ slot: { type: 'string' }, recipe_id: { type: 'string' } }) },
      }),
    },
    budget: {
      ...nullable('integer'),
      description: 'Whole pesos for this shopping, only if the user gave one; null otherwise. Never assume it.',
    },
    products: {
      type: 'array',
      description:
        'One entry per food on the shopping list (food, unit and other_name as in the recipes), with the store_sku you picked at each store from search_products, or null where none fits.',
      // No food enum here: menuProblems checks these foods like the recipes'.
      items: object({
        food: { type: 'string', description: "The catalog food or 'other', as in the recipes." },
        other_name: nullable('string'),
        unit: { type: 'string', enum: ['g', 'ml', 'un'] },
        disco: nullable('string'),
        geant: nullable('string'),
        tata: nullable('string'),
      }),
    },
  }),
}

// Reads the store_products catalog through the search_products RPC. Writes nothing. Not strict: one list of strings
// is easy to check in runTool, and every strict tool adds to a grammar the API caps.
const searchProducts: Anthropic.Beta.BetaTool = {
  name: 'search_products',
  description:
    "Search the supermarkets' products (Disco, Géant, Ta-Ta), with real prices. Send every search you need in one call: two or three Spanish queries per food, the generic name and the cuts, forms or varieties it's sold as (pollo: suprema, pechuga, muslo; papa: papa rosada; tomate: tomate perita).",
  input_schema: object({ queries: { type: 'array', items: { type: 'string' }, description: '1 to 20 queries.' } }),
}

// Partial on purpose: only the foods sent change, so marks made in the List tab meanwhile stay.
// Strict can't check that a food is on the list: runTool does.
const updateShoppingList: Anthropic.Beta.BetaTool = {
  name: 'update_shopping_list',
  description:
    "Record what the user already has at home, so the shopping list buys less, and show the updated list as a card in the chat. Only the foods sent change. Send each food exactly as the saved menu has it: food, unit and other_name.",
  strict: true,
  input_schema: object({
    reset: { type: 'boolean', description: 'true clears every earlier mark first, for a new round of shopping.' },
    items: {
      type: 'array',
      items: object({
        food: { type: 'string', enum: [...Object.keys(catalog), 'other'] },
        other_name: { ...nullable('string'), description: "The menu's name for an 'other' food, otherwise null." },
        unit: { type: 'string', enum: ['g', 'ml', 'un'] },
        have: {
          ...nullable('number'),
          description:
            "How much they have at home now, raw as bought, in unit, not an addition: two bananas in g is about 300. null: enough, or they don't want to buy it. 0: none, buy all of it again.",
        },
      }),
    },
  }),
}

// Writes nothing: the web app shows the saved menu as a card under the call.
const showMenu: Anthropic.Beta.BetaTool = {
  name: 'show_menu',
  description: "Show the user's saved menu as a card in the chat.",
  strict: true,
  input_schema: object({}),
}

// Writes nothing: the web app shows the list, with its total, as a card under the call.
const showShoppingList: Anthropic.Beta.BetaTool = {
  name: 'show_shopping_list',
  description:
    "Show the user's shopping list (the saved menu added up, minus what they have at home), with its total and what it comes to per day, as a card in the chat.",
  strict: true,
  input_schema: object({}),
}

// The recurring order (ADR 0039): repeat_every and repeat_from on the menus row, which the Menu tab writes too.
const setRepeat: Anthropic.Beta.BetaTool = {
  name: 'set_repeat',
  description:
    "Make the user's order (the saved menu's shopping) repeat every every_days days from today, or stop it with null. The Menu tab shows it with the next date.",
  strict: true,
  input_schema: object({
    every_days: {
      ...nullable('integer'),
      description: `1 to ${MAX_REPEAT_DAYS}: the menu's number of days unless the user asked for another interval. null stops it.`,
    },
  }),
}

// How the model reads the recurring order: "every 7 days, next order Saturday, October 25, 2026", or "off".
function repeatText(every: number | null, from: string | null) {
  if (!every || !from) return 'off'
  const next = new Date(`${nextOrder(from, every, todayInMontevideo())}T12:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `every ${every} days, next order ${next}`
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  // The caller's own token and the public key: every read below runs under row-level security.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, req.headers.get('apikey') ?? '', {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: auth } = await supabase.auth.getUser(token)
  if (!auth.user) return json(401, { error: 'not signed in' })
  const userId = auth.user.id

  const body = await req.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text || text.length > 4000) return json(400, { error: 'text must be 1 to 4000 characters' })
  const conversationId = typeof body?.conversation_id === 'string' ? body.conversation_id : ''

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ data: conversation }, { count, error: countError }] = await Promise.all([
    supabase.from('conversations').select('id').eq('id', conversationId).maybeSingle(),
    // The user's turns in the last 24 hours. Tool results are stored as user rows too, but start with a tool_result.
    // shortcut: turns are stored when the reply ends, so parallel requests all pass; use an atomic counter if abused.
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .eq('content->0->>type', 'text')
      .gte('created_at', since),
  ])
  if (!conversation) return json(404, { error: 'conversation not found' })
  if (countError) return json(500, { error: countError.message })
  if ((count ?? 0) >= DAILY_TURNS) return json(429, { error: 'daily message limit reached' })

  const [{ data: history, error }, { data: profile }, { data: menu }] = await Promise.all([
    supabase.from('messages').select('role, content').eq('conversation_id', conversationId).order('id'),
    supabase.from('profiles').select('data').maybeSingle(),
    supabase.from('menus').select('data, repeat_every, repeat_from').maybeSingle(),
  ])
  if (error) return json(500, { error: error.message })

  // The profile and the menu can change in another chat, and the date overnight. Each is shown again whenever it
  // differs from the last copy this chat saw, so a save never overwrites newer data with a stale view.
  const seen = history
    .flatMap((row: MessageParam) => (typeof row.content === 'string' ? [] : row.content))
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
  const content: Anthropic.Beta.BetaTextBlockParam[] = []
  const profileText = profile ? `${PROFILE_TAG}${JSON.stringify(profile.data)}</saved_profile>` : ''
  if (profileText && profileText !== seen.findLast((t) => t.startsWith(PROFILE_TAG))) {
    content.push({ type: 'text', text: profileText })
  }
  const menuText = menu ? `${MENU_TAG}${JSON.stringify(menu.data)}</saved_menu>` : ''
  if (menuText && menuText !== seen.findLast((t) => t.startsWith(MENU_TAG))) {
    content.push({ type: 'text', text: menuText })
  }
  const repeat = menu ? `${REPEAT_TAG}${repeatText(menu.repeat_every, menu.repeat_from)}</saved_repeat>` : ''
  if (repeat && repeat !== seen.findLast((t) => t.startsWith(REPEAT_TAG))) content.push({ type: 'text', text: repeat })
  // Today in Montevideo (the app's only city), so a menu can start tomorrow and name its days. Here, not in the
  // system prompt, which stays the same for every request so it caches.
  const today = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Montevideo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const todayText = `${TODAY_TAG}${today}</today>`
  if (todayText !== seen.findLast((t) => t.startsWith(TODAY_TAG))) content.push({ type: 'text', text: todayText })
  content.push({ type: 'text', text })

  const messages: MessageParam[] = history
  const newRows: MessageParam[] = [{ role: 'user', content }]
  messages.push(newRows[0])

  // The picked products as store_products has them now, one query per store: Disco and Géant share sku ids. Rows a
  // store no longer lists are left out, as in the List tab (freshRows).
  async function productRows(menu: MenuData): Promise<ProductRow[]> {
    const skus = skusByStore(menu)
    const [newest, ...reads] = await Promise.all([
      supabase.rpc('store_newest'),
      ...stores
        .filter((store) => skus[store].length)
        .map((store) =>
          supabase.from('store_products').select(productColumns).eq('store_key', store).in('store_sku', skus[store]),
        ),
    ])
    const failed = reads.find((read) => read.error)
    if (failed?.error) throw new Error(failed.error.message)
    // Without the newest reads, no row is dropped: the rule is a filter, and the price still shows.
    if (newest.error) console.error(newest.error)
    const rows = reads.flatMap((read) => (read.data ?? []) as unknown as ProductRow[])
    return freshRows(rows, (newest.data ?? []) as Newest)
  }

  // The price as the model reads it. Never an error: a saved menu stays saved if prices can't be read.
  async function priceText(menu: MenuData, have: Have): Promise<string> {
    try {
      return `Prices (real, from the stores' websites; quote only these): ${verdict(pricing(menu, have, await productRows(menu)))}`
    } catch (err) {
      console.error(err)
      return 'Prices unavailable right now.'
    }
  }

  // Runs one tool call for the user. problem: what went wrong, or '' once it's done. info: what the model reads after
  // that (search results, prices). show_menu only reports, so its answer is never an error: the web app shows the card
  // whenever the chat has a menu. A list card needs a menu.
  async function runTool(name: string, input: unknown): Promise<{ problem: string; info?: string }> {
    const updated_at = new Date().toISOString()
    if (name === 'save_profile') {
      const { error } = await admin.from('profiles').upsert({ user_id: userId, data: input, updated_at })
      return { problem: error ? `Could not save: ${error.message}` : '' }
    }
    if (name === 'search_products') {
      const sent = (input as { queries?: unknown }).queries
      const texts = Array.isArray(sent) ? sent.filter((q): q is string => typeof q === 'string') : []
      const queries = [...new Set(texts.map((q) => q.trim()).filter(Boolean))].slice(0, 20)
      if (!queries.length) return { problem: 'Send at least one query.' }
      const found = await Promise.all(queries.map((q) => supabase.rpc('search_products', { q, lim: 5 })))
      const failed = found.find((result) => result.error)
      if (failed?.error) return { problem: `Could not search: ${failed.error.message}` }
      return { problem: '', info: searchText(queries.map((query, i) => ({ query, rows: (found[i].data ?? []) as SearchRow[] }))) }
    }
    if (name === 'save_menu') {
      // A copy: the stored assistant turn must keep the input exactly as the model wrote it.
      const shape = menuShapeProblems(input)
      if (shape.length) return { problem: `Not saved. Fix this and call save_menu again:\n${shape.join('\n')}` }
      const menu = structuredClone(input) as MenuData
      const problems = menuProblems(menu)
      if (!problems.length) {
        try {
          problems.push(...productProblems(menu, await productRows(menu)))
        } catch (err) {
          return { problem: `Could not check the products: ${(err as Error).message}` }
        }
      }
      if (problems.length) return { problem: `Not saved. Fix this and call save_menu again:\n${problems.join('\n')}` }
      const { data: saved, error } = await admin
        .from('menus')
        .upsert({ user_id: userId, data: menu, updated_at })
        .select('have')
        .single()
      if (error) return { problem: `Could not save: ${error.message}` }
      return { problem: '', info: await priceText(menu, saved.have ?? {}) }
    }
    if (name === 'update_shopping_list') {
      type Mark = Pick<Ingredient, 'food' | 'other_name' | 'unit'> & { have: number | null }
      const { reset, items } = structuredClone(input) as { reset: boolean; items: Mark[] }
      const { data: row, error } = await supabase.from('menus').select('data, have').maybeSingle()
      if (error) return { problem: `Could not save: ${error.message}` }
      if (!row) return { problem: 'No menu yet. Build the menu first.' }
      const onList = new Set(buildList(row.data).map((item) => item.id))
      const problems = items.flatMap((item, i) => {
        const where = `Item ${i + 1}`
        const found = foodProblems(item, where)
        if (found.length) return found
        if (item.have !== null && !(item.have >= 0)) return [`${where}: have must be null, 0 or more.`]
        if (onList.has(itemId(item.food, item.other_name, item.unit))) return []
        return [
          `${where}: ${item.other_name ?? item.food} in ${item.unit} is not on the list. If the menu has it, use the food, unit and other_name exactly as in <saved_menu>. If not, leave it out, send the rest again and tell the user in a few words.`,
        ]
      })
      if (problems.length) return { problem: `Not saved. Fix this and call update_shopping_list again:\n${problems.join('\n')}` }
      const have: Have = reset ? {} : row.have
      for (const item of items) {
        const id = itemId(item.food, item.other_name, item.unit)
        if (item.have === 0) delete have[id]
        else have[id] = item.have
      }
      // shortcut: read then write, and the List tab writes its whole map, so a List tab that hasn't reloaded since
      // (it reloads when shown) can undo this. Fine for one person on one phone; merge per item if that changes.
      const { error: saveError } = await admin.from('menus').update({ have }).eq('user_id', userId)
      return { problem: saveError ? `Could not save: ${saveError.message}` : '' }
    }
    if (name === 'set_repeat') {
      const every = (input as { every_days: number | null }).every_days
      if (every !== null && !(Number.isInteger(every) && every >= 1 && every <= MAX_REPEAT_DAYS)) {
        return { problem: `Not saved. every_days must be null or 1 to ${MAX_REPEAT_DAYS}.` }
      }
      const repeat = { repeat_every: every, repeat_from: every ? todayInMontevideo() : null }
      const { data: row, error } = await admin.from('menus').update(repeat).eq('user_id', userId).select('user_id').maybeSingle()
      if (error) return { problem: `Could not save: ${error.message}` }
      if (!row) return { problem: 'No menu yet. Build the menu first.' }
      return { problem: '', info: `Recurring order now: ${repeatText(repeat.repeat_every, repeat.repeat_from)}.` }
    }
    if (name === 'show_menu' || name === 'show_shopping_list') {
      const { data: row, error } = await supabase.from('menus').select('user_id').maybeSingle()
      if (error) return { problem: `Could not check the menu: ${error.message}` }
      return { problem: row ? '' : 'No menu yet. Build the menu first.' }
    }
    return { problem: `Unknown tool ${name}.` }
  }

  // The list as it stands, for the model's next edit: "la mitad" or "comprá solo 500 g" start from real numbers.
  async function listState(): Promise<string> {
    const { data: row, error } = await supabase.from('menus').select('data, have').maybeSingle()
    if (error) return `\nCould not read the list: ${error.message}`
    if (!row) return ''
    const intro =
      "The list card, with the total and what it comes to per day, is in the chat. Don't write the list. The list now (menu: what the menu uses; have: at home; buy: what the card buys):"
    return `\n${await priceText(row.data, row.have)}\n${intro}\n${listLines(row.data, row.have)}`
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // One JSON object per line: the reply's text, or the step the status line shows (ADR 0029).
      const send = (event: { text: string } | { step: string }) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      // Separates the text before and after a tool call, which are separate bubbles once reloaded.
      let wrote = false
      let breakBeforeNext = false
      const write = (delta: string) => {
        send({ text: breakBeforeNext ? `\n\n${delta}` : delta })
        breakBeforeNext = false
        wrote = true
      }

      // The function stops at 150 s and a cut-off turn stores nothing, so late rounds go without tools (ADR 0024).
      const started = Date.now()
      const late = () => Date.now() - started > 100_000
      try {
        for (let round = 0; round < ROUNDS; round++) {
          const last = round === ROUNDS - 1 || late()
          const reply = anthropic.beta.messages.stream({
            model: 'claude-sonnet-5-5',
            max_tokens: 16000,
            cache_control: { type: 'ephemeral' },
            system: SYSTEM_PROMPT,
            tools: [saveProfile, saveMenu, showMenu, updateShoppingList, showShoppingList, setRepeat, searchProducts],
            // No tools in the last round, so the turn ends on a reply about the earlier calls, not on tool results.
            tool_choice: { type: last ? 'none' : 'auto' },
            messages,
            // Prompt changes during development drop old reasoning instead of failing with a 400.
            thinking: { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } },
            output_config: { effort: 'medium' },
            fallbacks: 'default',
            betas: ['server-side-fallback-2026-07-01', 'thinking-binding-controls-2026-08-01'],
          })
          reply.on('text', write)
          // The tool being called, writing, or thinking: each block says which as it starts.
          reply.on('streamEvent', (event) => {
            if (event.type !== 'content_block_start') return
            const block = event.content_block
            send({ step: block.type === 'tool_use' ? block.name : block.type === 'text' ? 'typing' : 'thinking' })
          })
          const message = await reply.finalMessage()
          breakBeforeNext = wrote
          // Cost and time per round, in the function's logs.
          const tools = message.content.flatMap((block) => (block.type === 'tool_use' ? [block.name] : []))
          console.log(JSON.stringify({ round, ms: Date.now() - started, usage: message.usage, tools }))

          // Either of these, stored, would make every later request in this chat fail.
          // A tool call with no result (cut off at max_tokens, or a refusal): store nothing, so the user can resend.
          if (message.stop_reason !== 'tool_use' && message.content.some((block) => block.type === 'tool_use')) {
            throw new Error(`tool call without a result (${message.stop_reason})`)
          }
          // An empty reply (it can follow a tool result): leave it out and end the turn here.
          if (!message.content.length) break

          const turn: MessageParam = { role: 'assistant', content: message.content }
          messages.push(turn)
          newRows.push(turn)
          // end_turn, refusal or max_tokens: nothing more to run.
          if (message.stop_reason !== 'tool_use') break

          // Before the last round, say so: otherwise the model may promise or report a save it can no longer make.
          const note =
            round === ROUNDS - 2 || late()
              ? "\nNo more tool calls this turn: tell the user in one line what was saved and what wasn't."
              : ''
          const calls: { id: string; content: string; is_error: boolean; list: boolean }[] = []
          for (const block of message.content) {
            if (block.type !== 'tool_use') continue
            const { problem, info } = await runTool(block.name, block.input)
            const done = block.name === 'search_products' ? '' : block.name.startsWith('show_') ? 'Shown.' : 'Saved.'
            const list = !problem && (block.name === 'show_shopping_list' || block.name === 'update_shopping_list')
            const is_error = !!problem && block.name !== 'show_menu'
            calls.push({ id: block.id, content: problem || [done, info].filter(Boolean).join('\n'), is_error, list })
          }
          // Read once every call has run, so a save_menu in the same message is already in the list.
          const lastList = calls.findLast((call) => call.list)
          if (lastList) lastList.content += await listState()
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = calls.map(({ id, content, is_error }) => ({
            type: 'tool_result' as const,
            tool_use_id: id,
            content: content + note,
            is_error,
          }))
          const toolTurn: MessageParam = { role: 'user', content: results }
          messages.push(toolTurn)
          newRows.push(toolTurn)
        }

        // Nothing came back at all (a refusal before any output): store nothing and fail, so the client
        // gives the text back to rephrase.
        if (newRows.length === 1) throw new Error('empty reply')

        // Stored only once the whole exchange worked, so a failed turn can simply be resent.
        const { error } = await admin
          .from('messages')
          .insert(newRows.map((row) => ({ ...row, user_id: userId, conversation_id: conversationId })))
        if (error) throw new Error(error.message)
        await admin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
        controller.close()
      } catch (err) {
        console.error(err)
        controller.error(err)
      }
    },
  })

  return new Response(stream, { headers: { ...cors, 'Content-Type': 'application/x-ndjson; charset=utf-8' } })
})
