# Menu preview in the chat

Status: **done**.

## Context
When the chat saves a menu, the user only reads "la tenés en Menú" and has to switch tabs to see it. They want a preview of the week right in the chat, with a button that opens the Menu tab.

## Design
- **No server change.** Every successful `save_menu` is already stored in `messages`: the `tool_use` block holds the week, and the next row's `tool_result` says whether it saved (`is_error`).
- **Chat** shows a preview card under the reply that called `save_menu`, only when its result wasn't an error. The card shows the week as it was saved then, one line per day with its meals, and a "Ver menú" button that opens the Menu tab.
- **Live turns**: the reply streams as plain text, so the browser can't see the tool call. When a turn ends, the chat reloads its messages from the database, and the preview appears. The reload finishes before the send box unlocks, so it can't overwrite a newer message.

## Steps
1. Save this plan.
2. `src/Menu.tsx`: a `MenuPreview` component, sharing the day order with the Menu tab.
3. `src/Chat.tsx`: `save_menu` calls in `toBubbles`, reload after each turn, `onOpenMenu` prop. `src/App.tsx` passes it.
4. `src/strings.ts`, `src/index.css`.
5. `npm run build`, `npm run lint`.
6. Docs: `docs/architecture.md` (Chat screen), `docs/product.md` if it describes the chat's menu reply.
