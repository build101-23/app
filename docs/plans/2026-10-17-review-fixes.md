# Review fixes

Status: **done**.

## Context
A correctness review of the app found five bugs, all timing or edge cases. The docs already describe the right behaviour; the code didn't match it.

## Design
- **List tab: a tap during a reload is undone on screen.** Coming back to the app reloads the list. A tap made while that read is in flight sets the screen at once, then the older read lands on top of it. The next tap builds on the stale map and writes it over the first. Fix: that reload keeps the screen's `have`, which the tap's save writes, and takes the rest of the row (a newer menu, its confirmation).
- **Menu tab: Confirm can confirm a menu the user hasn't seen.** The chat may save a new menu (another device, another chat) after the tab loaded. Fix: the update matches the `updated_at` on screen. If nothing matches, the tab reloads and says the menu changed.
- **Chat: a message can land in the wrong chat.** On open, the chat loads the chat list and then opens the latest chat. A message sent before that goes to a new chat, and the screen then switches to the old one. The same happens when a chat is picked from the list mid-reply, or a message is sent before a picked chat has loaded. Fix: sending stays locked until a chat's messages are on screen, and the chat list is locked mid-reply.
- **Chat: the preview's "Ver menú" button leaves mid-reply.** The tabs are locked while a reply streams, but the preview's button isn't. Fix: disabled while busy, like the tabs.
- **Chat function: the fifth round can end on tool results.** The loop runs at most 5 calls to Claude. If the fifth one also calls a tool, the turn is stored ending on a tool result, and the user gets no reply about it. Fix: the last call uses `tool_choice: none`, and the tool results before it say no more tool calls are left, so the model reports what was saved instead of promising a save. An empty last reply still ends the turn on tool results, as before.

## Steps
1. Save this plan.
2. `src/List.tsx`, `src/Menu.tsx`, `src/Chat.tsx`, `src/strings.ts`, `supabase/functions/chat/index.ts`.
3. `npm run build`, `npm run lint`, `npm test`.
4. Docs: no living doc changes. The behaviour is as `docs/product.md` and `docs/architecture.md` already describe it.
