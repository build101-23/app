import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { SYSTEM_PROMPT } from './prompt.ts'

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

  const { data: history, error } = await supabase.from('messages').select('role, content').order('id')
  if (error) return json(500, { error: error.message })

  const messages: MessageParam[] = history
  const newRows: MessageParam[] = [{ role: 'user', content: [{ type: 'text', text }] }]
  messages.push(newRows[0])

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
            tools: [saveProfile],
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

          const turn: MessageParam = { role: 'assistant', content: message.content }
          messages.push(turn)
          newRows.push(turn)
          // end_turn, refusal, or a tool call cut off at max_tokens: nothing more to run.
          if (message.stop_reason !== 'tool_use') break

          const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
          for (const block of message.content) {
            if (block.type !== 'tool_use') continue
            const { error } = await supabase
              .from('profiles')
              .upsert({ user_id: userId, data: block.input, updated_at: new Date().toISOString() })
            results.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: error ? `Could not save: ${error.message}` : 'Saved.',
              is_error: !!error,
            })
          }
          const toolTurn: MessageParam = { role: 'user', content: results }
          messages.push(toolTurn)
          newRows.push(toolTurn)
        }

        // Stored only once the whole exchange worked, so a failed turn can simply be resent.
        const { error } = await supabase.from('messages').insert(newRows)
        if (error) throw new Error(error.message)
        controller.close()
      } catch (err) {
        console.error(err)
        controller.error(err)
      }
    },
  })

  return new Response(stream, { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } })
})
