# Chat: read a plain-text reply too

## Context
Before [ADR 0029](../adr/0029-chat-streams-its-steps.md) the `chat` function streamed the reply as plain text (`text/plain`); now it streams one JSON object per line (`application/x-ndjson`), and the web app parses every line as JSON. The function deploys by hand (`supabase functions deploy chat`), from whatever checkout runs it. Deployed from a checkout older than ADR 0029, it would answer plain text again, `JSON.parse` would throw on the first chunk, and every turn would fail with "No se pudo enviar" while the server still stored it. On 18/10 the local `main` checkout was at such a commit, and the pitch is the same day.

## Steps
1. `src/Chat.tsx`: when the reply's `Content-Type` isn't NDJSON, append each chunk to the reply as it is, with no steps (the status line keeps "Armando la respuesta…"). `Content-Type` is CORS-safelisted, so the browser can read it with no header change in the function.
2. `src/dev/fixture.ts`: `reply=plain` streams the same reply as bare `text/plain`, with no steps, like a function from before ADR 0029.
3. Docs step: the `reply=plain` row in `docs/development.md`; a line in ADR 0029's consequences. No new ADR: the format doesn't change, the browser just tolerates the old one.

## Verification
- `npm run build`, `npm run lint`, `npm test`.
- `npm run dev:fixture`: a sent message streams with its steps and only text in the bubble; with `?reply=plain` the reply streams as text, the status line stays on "Armando la respuesta…", and no JSON shows.
