# Chat bar: icons instead of underlined links

## Context
The chat bar (`src/Chat.tsx`) shows "Chats"/"Volver" and "Nuevo chat" as underlined green text links (`.link`). They read as clutter; the user wants icons instead: a minimalist chats icon for the list and a + for a new chat.

## Steps
1. Branch from `main` in its own worktree. Save this plan.
2. `src/ui.tsx`: add `ChatsIcon` (two overlapping speech bubbles, same rounded style as `ChatIcon`) and `PlusIcon`, with the existing `Icon` wrapper.
3. `src/Chat.tsx`: the two `.link` buttons become icon buttons. Their names stay as `aria-label`s. The chats button stays a toggle with `aria-pressed`, like the mic button. Same handlers and `disabled={busy}`.
4. `src/strings.ts`: delete `chat.back` ("Volver"), now unused.
5. `src/index.css`: replace `.chat-bar .link` with 44 px round icon buttons in green ink, shaped like `.mic`: a sunk-surface fill on hover and while pressed (the capsule tint is white and would not show on the ground), muted ink when disabled. Trim the bar's padding so it doesn't grow.
6. Docs step: update the chat bar in `docs/design.md`. No ADR: a small visual change inside [ADR 0025](../adr/0025-viveri-identity-and-ui-system.md).

## Verification
- `npm run dev:fixture`: the chat bar in light and dark and at mobile width; the chats icon opens and closes the list (tinted while open); + starts a new chat.
- `npm run lint` and `npm run build`.
