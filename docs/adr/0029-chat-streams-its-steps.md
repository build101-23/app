# 0029. The chat streams the step it's on

- Status: Accepted
- Date: 2026-10-18

## Context
A menu turn can take 30 to 90 s: the model thinks, searches products, then writes the whole menu as a `save_menu` call. Until then the chat showed the animated mark and "Armando la respuesta…", so users waited without knowing anything was happening ([plan](../plans/2026-10-18-chat-steps.md)). Other AI chats show the current step ("Thinking", "Searching") with a shimmer.

The `chat` function streamed plain text, so the browser couldn't know the step. We had to decide:
- **How steps reach the browser.** Options: a marker inside the text stream, or a stream of small JSON events.
- **What a step says.** Options: the model's own reasoning text, or a fixed label per step.

## Decision
- **One JSON object per line** (`application/x-ndjson`): `{"text": "..."}` for the reply's words, `{"step": "..."}` when a content block starts. The step is the tool's name for a tool call, `typing` for text and `thinking` for anything else. The browser keeps a partial line until the rest arrives.
- **Fixed labels, chosen by the browser.** The server sends keys; the Spanish labels live in `t.chat.steps` in `src/strings.ts`, and an unknown key falls back to "Armando la respuesta…". We don't show the model's reasoning: it may be in English, long or not shown at all, and it isn't written for the user.

## Consequences
- The status line can say what's happening ("Buscando los mejores precios…", "Armando tu menú…") with no extra model calls.
- A new tool needs a label in `t.chat.steps`, or it shows the fallback.
- The function and the web app deploy separately, so the format changed in one step: deploy the function first. Until the web app catches up, an open old client shows raw JSON while a reply streams; the reload at the end of the turn puts the right bubble back.
- The other way round, a function deployed from a checkout older than this decision answers `text/plain`. The browser reads that body as the reply, with no steps, so turns still work ([plan](../plans/2026-10-18-chat-plain-text-fallback.md)).
