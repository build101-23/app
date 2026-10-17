# One menu card per turn

Status: **done**.

## Context
- The chat sometimes shows the same menu card twice. The model can call `save_menu` and then `show_menu` in the same turn (seen in production), and `toBubbles` in `src/Chat.tsx` adds a card for each call.

## Design
- In `toBubbles`, a `show_menu` call adds a card only if the turn hasn't shown one yet. A turn starts with the user's own text. Saves still show a card each time, because each one changes the menu.
- Fixed when the chat is shown, so chats already stored this way show one card too. The prompt stays as it is.

## Steps
1. Save this plan.
2. `src/Chat.tsx`: skip a `show_menu` card when the turn already has one.
3. `npm run build`, `npm run lint`, `npm test`.
4. Docs: `docs/architecture.md` (Chat flow, previews).
