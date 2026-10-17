import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { catalog } from '../_shared/catalog.ts'
import { days, menuProblems, type MenuData } from '../_shared/menu.ts'
import { MENU_TAG, PROFILE_TAG, SYSTEM_PROMPT } from './prompt.ts'

type MessageParam = Anthropic.Beta.BetaMessageParam

const anthropic = new Anthropic() // reads the ANTHROPIC_API_KEY secret

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
              description: `A catalog food, or 'other' for anything else. Catalog foods and their units:\n${Object.entries(
                catalog,
              )
                .map(([key, food]) => `${key} (${food.unit})`)
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

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  // The caller's own token and the public key: every query below runs under row-level security.
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

  const { data: conversation } = await supabase.from('conversations').select('id').eq('id', conversationId).maybeSingle()
  if (!conversation) return json(404, { error: 'conversation not found' })

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

  // Runs one tool call as the user. Returns what went wrong, or '' once it's saved.
  async function runTool(name: string, input: unknown): Promise<string> {
    const updated_at = new Date().toISOString()
    if (name === 'save_profile') {
      const { error } = await supabase.from('profiles').upsert({ user_id: userId, data: input, updated_at })
      return error ? `Could not save: ${error.message}` : ''
    }
    if (name === 'save_menu') {
      // A copy: the stored assistant turn must keep the input exactly as the model wrote it.
      const menu = structuredClone(input) as MenuData
      const problems = menuProblems(menu)
      if (problems.length) return `Not saved. Fix this and call save_menu again:\n${problems.join('\n')}`
      const { error } = await supabase
        .from('menus')
        .upsert({ user_id: userId, data: menu, confirmed_at: null, updated_at })
      return error ? `Could not save: ${error.message}` : ''
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
            tools: [saveProfile, saveMenu],
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

          const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
          for (const block of message.content) {
            if (block.type !== 'tool_use') continue
            const problem = await runTool(block.name, block.input)
            results.push({ type: 'tool_result', tool_use_id: block.id, content: problem || 'Saved.', is_error: !!problem })
          }
          const toolTurn: MessageParam = { role: 'user', content: results }
          messages.push(toolTurn)
          newRows.push(toolTurn)
        }

        // Nothing came back at all (a refusal before any output): store nothing and fail, so the client
        // gives the text back to rephrase.
        if (newRows.length === 1) throw new Error('empty reply')

        // Stored only once the whole exchange worked, so a failed turn can simply be resent.
        const { error } = await supabase
          .from('messages')
          .insert(newRows.map((row) => ({ ...row, conversation_id: conversationId })))
        if (error) throw new Error(error.message)
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
        controller.close()
      } catch (err) {
        console.error(err)
        controller.error(err)
      }
    },
  })

  return new Response(stream, { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } })
})
