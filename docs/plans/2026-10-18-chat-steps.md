# Chat shows what it's doing, with a shimmer

## Context
While a reply is on its way, the chat only shows the animated mark and a static caption ("Armando la respuesta…", then "Escribiendo…"). A menu turn can take 30–90 s (search products, think, write the whole menu as a tool call), so the user stares at dots. Modern AI chats (ChatGPT, Claude, Perplexity, Cursor) show the current step as a short label with a **shimmer**: a soft band of brighter color sweeping across muted text, looping, and the label cross-fades when the step changes. We do the same with steps the server actually knows.

Today `supabase/functions/chat/index.ts` streams plain text only, so the browser can't know the step. The Anthropic SDK stream already tells us: each `content_block_start` says thinking, text, or `tool_use` with the tool's name.

## Approach

### 1. Server: stream NDJSON events (`supabase/functions/chat/index.ts`)
- Replace plain-text chunks with one JSON object per line: `{"text": "..."}` or `{"step": "..."}`. Content-Type `application/x-ndjson`.
- `write(delta)` keeps its `\n\n` break logic but sends `{text}`.
- In the round loop, next to `reply.on('text', write)`:
  ```ts
  // The step the status line shows: the tool being called, writing, or thinking.
  reply.on('streamEvent', (event) => {
    if (event.type !== 'content_block_start') return
    const block = event.content_block
    send({ step: block.type === 'tool_use' ? block.name : block.type === 'text' ? 'typing' : 'thinking' })
  })
  ```
- Steps are keys, not text: Spanish labels stay in `src/strings.ts` (AGENTS.md).

### 2. Client: parse lines, show the step (`src/Chat.tsx`)
- New state `step` (reset to `''` in `submit`). The read loop buffers the remainder after the last `\n`, `JSON.parse`s each full line, appends `text` to the reply, sets `step`. A bad line throws into the existing catch (text given back, error shown).
- Status text: `streaming ? (t.chat.steps[step] ?? t.chat.waiting) : ''`. Drop the `waiting` const.
- Render inside the always-mounted `role="status"` `<p>`: `<span key={status}>{status}</span>` so each new step remounts and fades in; screen readers still announce each change.
- The waiting bubble keeps the animated `Mark`.

### 3. Labels (`src/strings.ts`)
Move `typing` into a `steps` map (typed `Record<string, string>`, keyed by the server's step):
- `thinking`: Pensando…
- `typing`: Escribiendo…
- `search_products`: Buscando los mejores precios…
- `save_menu`: Armando tu menú…
- `save_profile`: Guardando lo que me contaste…
- `update_shopping_list`: Actualizando tu lista…
- `show_menu`: Preparando tu menú…
- `show_shopping_list`: Sumando tu lista…

`waiting` ("Armando la respuesta…") stays as the label before the first event.

### 4. Animation (`src/index.css`)
- `.chat-status span`: `display: inline-block; animation: fade-in var(--dur) var(--ease)`.
- Inside `@media (prefers-reduced-motion: no-preference)`: gradient `var(--ink-muted) 40%, var(--ink) 50%, var(--ink-muted) 60%` at `250%` width, `background-clip: text` (+ `-webkit-` for iOS Safari), `color: transparent`, plus `shimmer 1.8s linear infinite` (`background-position` 100% → 0, band sweeps left to right).
- Contrast never drops below today's muted caption (the band goes darker in light mode, lighter in dark). Reduced motion: plain muted text, as now. Forced colors: `color` is forced, so text stays visible.

### 5. Fixture (`src/dev/fixture.ts`)
Stream NDJSON like the real function: `thinking` (~900 ms), `search_products` (~900 ms), `typing`, then the text chunks. Update its comment.

### 6. Deploy order
Function first (`npx supabase functions deploy chat`, manual, ask before running), then merge so Cloudflare deploys the web app. In between, old clients show raw JSON while streaming; their reload at the end of the turn fixes the bubble. Cosmetic, minutes.

### 7. Docs
- Save this plan as `docs/plans/2026-10-18-chat-steps.md`.
- `docs/architecture.md`: "streams the reply as plain text" → NDJSON text and step events (component list + data flow).
- `docs/design.md`: Status line section (steps, shimmer, fade; link to `src/strings.ts` for labels, don't copy them); Motion table row `shimmer | 1.8s loop | the chat's status line`; reduced-motion note.
- ADR `docs/adr/0029-chat-streams-its-steps.md`: NDJSON over plain text; fixed labels per step chosen by the client rather than showing the model's reasoning. Add to `docs/adr/README.md`.

## Verification
- `npm run lint`, `npm run build`, `npm test`.
- Type-check the function: `npx deno check supabase/functions/chat/index.ts` (no local deno; skip if that fails to fetch).
- `preview_start web-fixture` (port 5199): send a message, read the status line through Pensando → Buscando los mejores precios → Escribiendo; screenshot mid-shimmer; check computed `animation-name` on the span; dark mode via `resize_window colorScheme: dark`.
- After the function deploy (with the user's OK): one real menu turn on the hosted app, confirm steps appear and the stored turn reloads normally.
