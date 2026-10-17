import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { catalog, type CatalogKey } from '../_shared/catalog.ts'
import { buildList, itemId, type Have } from '../_shared/list.ts'
import { days, foodProblems, menuProblems, type Ingredient, type MenuData } from '../_shared/menu.ts'
import { nutritionText } from '../_shared/nutrition.ts'
import { MENU_TAG, PROFILE_TAG, SYSTEM_PROMPT } from './prompt.ts'

type MessageParam = Anthropic.Beta.BetaMessageParam

const anthropic = new Anthropic() // reads the ANTHROPIC_API_KEY secret

// Users can only read their rows (ADR 0014), so this function writes with the service role. It skips
// row-level security: every write names its user_id, or a conversation the user's own client found.
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const DAILY_TURNS = 100

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
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})

// A few recipes that repeat, referenced by id from the days. Recipes come first so they're written
// before the days that point at them. Strict can't check ids, units or the 7 days:
// menuProblems (../_shared/menu.ts) does.
const saveMenu: Anthropic.Beta.BetaTool = {
  name: 'save_menu',
  description:
    "Save the user's weekly menu, Monday to Sunday. Each call replaces the saved menu, so always send the whole week.",
  strict: true,
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
      items: object({
        day: { type: 'string', enum: [...days] },
        meals: { type: 'array', items: object({ slot: { type: 'string' }, recipe_id: { type: 'string' } }) },
      }),
    },
  }),
}

// Partial on purpose: only the foods sent change, so the model never needs to see the saved marks.
// Strict can't check that a food is on this week's list: runTool does.
const updateShoppingList: Anthropic.Beta.BetaTool = {
  name: 'update_shopping_list',
  description:
    "Record what the user already has at home, so the shopping list in the List tab buys less. Only the foods sent change. Send each food exactly as the saved menu has it: food, unit and other_name.",
  strict: true,
  input_schema: object({
    reset: { type: 'boolean', description: 'true clears every earlier mark first, for a new week.' },
    items: {
      type: 'array',
      items: object({
        food: { type: 'string', enum: [...Object.keys(catalog), 'other'] },
        other_name: { ...nullable('string'), description: "The menu's name for an 'other' food, otherwise null." },
        unit: { type: 'string', enum: ['g', 'ml', 'un'] },
        have: {
          ...nullable('number'),
          description: "How much they have at home, in unit. null: enough, or they don't want to buy it. 0: none, buy all of it again.",
        },
      }),
    },
  }),
}

// Writes nothing: the web app shows the saved week as a card under the call.
const showMenu: Anthropic.Beta.BetaTool = {
  name: 'show_menu',
  description: "Show the user's saved weekly menu as a card in the chat.",
  strict: true,
  input_schema: object({}),
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
    supabase.from('menus').select('data').maybeSingle(),
  ])
  if (error) return json(500, { error: error.message })

  // The profile and the menu can change in another chat. Each is shown again whenever it differs from
  // the last copy this chat saw, so a save never overwrites newer data with a stale view.
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
  content.push({ type: 'text', text })

  const messages: MessageParam[] = history
  const newRows: MessageParam[] = [{ role: 'user', content }]
  messages.push(newRows[0])

  // Runs one tool call for the user. Returns what went wrong, or '' once it's saved. show_menu only reports,
  // so its answer is never an error: the web app shows the card whenever the chat has a menu.
  async function runTool(name: string, input: unknown): Promise<string> {
    const updated_at = new Date().toISOString()
    if (name === 'save_profile') {
      const { error } = await admin.from('profiles').upsert({ user_id: userId, data: input, updated_at })
      return error ? `Could not save: ${error.message}` : ''
    }
    if (name === 'save_menu') {
      // A copy: the stored assistant turn must keep the input exactly as the model wrote it.
      const menu = structuredClone(input) as MenuData
      const problems = menuProblems(menu)
      if (problems.length) return `Not saved. Fix this and call save_menu again:\n${problems.join('\n')}`
      const { error } = await admin
        .from('menus')
        .upsert({ user_id: userId, data: menu, confirmed_at: null, updated_at })
      return error ? `Could not save: ${error.message}` : ''
    }
    if (name === 'update_shopping_list') {
      type Mark = Pick<Ingredient, 'food' | 'other_name' | 'unit'> & { have: number | null }
      const { reset, items } = structuredClone(input) as { reset: boolean; items: Mark[] }
      const { data: row, error } = await supabase.from('menus').select('data, have').maybeSingle()
      if (error) return `Could not save: ${error.message}`
      if (!row) return 'No menu yet. Build the menu first.'
      const onList = new Set(buildList(row.data).map((item) => item.id))
      const problems = items.flatMap((item, i) => {
        const where = `Item ${i + 1}`
        const found = foodProblems(item, where)
        if (found.length) return found
        if (item.have !== null && !(item.have >= 0)) return [`${where}: have must be null, 0 or more.`]
        if (onList.has(itemId(item.food, item.other_name, item.unit))) return []
        return [
          `${where}: ${item.other_name ?? item.food} in ${item.unit} is not on this week's list. Use the food, unit and other_name exactly as in <saved_menu>.`,
        ]
      })
      if (problems.length) return `Not saved. Fix this and call update_shopping_list again:\n${problems.join('\n')}`
      const have: Have = reset ? {} : row.have
      for (const item of items) {
        const id = itemId(item.food, item.other_name, item.unit)
        if (item.have === 0) delete have[id]
        else have[id] = item.have
      }
      // shortcut: read then write, and the List tab writes its whole map, so a List tab that hasn't reloaded since
      // (it reloads when shown) can undo this. Fine for one person on one phone; merge per item if that changes.
      const { error: saveError } = await admin.from('menus').update({ have }).eq('user_id', userId)
      return saveError ? `Could not save: ${saveError.message}` : ''
    }
    if (name === 'show_menu') {
      const { data: row, error } = await supabase.from('menus').select('confirmed_at').maybeSingle()
      if (error) return `Could not check the menu: ${error.message}`
      if (!row) return 'No menu yet. Build the menu first.'
      return row.confirmed_at ? 'Shown. The user already confirmed it.' : 'Shown. Not confirmed yet.'
    }
    return `Unknown tool ${name}.`
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Separates the text before and after a tool call, which are separate bubbles once reloaded.
      let wrote = false
      let breakBeforeNext = false
      const write = (delta: string) => {
        if (breakBeforeNext) controller.enqueue(encoder.encode('\n\n'))
        breakBeforeNext = false
        wrote = true
        controller.enqueue(encoder.encode(delta))
      }

      try {
        for (let round = 0; round < 5; round++) {
          const reply = anthropic.beta.messages.stream({
            model: 'claude-sonnet-5-5',
            max_tokens: 16000,
            cache_control: { type: 'ephemeral' },
            system: SYSTEM_PROMPT,
            tools: [saveProfile, saveMenu, showMenu, updateShoppingList],
            // No tools in the last round, so the turn ends on a reply about the earlier calls, not on tool results.
            tool_choice: { type: round < 4 ? 'auto' : 'none' },
            messages,
            // Prompt changes during development drop old reasoning instead of failing with a 400.
            thinking: { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } },
            output_config: { effort: 'medium' },
            fallbacks: 'default',
            betas: ['server-side-fallback-2026-07-01', 'thinking-binding-controls-2026-08-01'],
          })
          reply.on('text', write)
          const message = await reply.finalMessage()
          breakBeforeNext = wrote

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
            round === 3 ? "\nNo more tool calls this turn: tell the user in one line what was saved and what wasn't." : ''
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
          for (const block of message.content) {
            if (block.type !== 'tool_use') continue
            const problem = await runTool(block.name, block.input)
            const is_error = !!problem && block.name !== 'show_menu'
            results.push({ type: 'tool_result', tool_use_id: block.id, content: (problem || 'Saved.') + note, is_error })
          }
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

  return new Response(stream, { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } })
})
