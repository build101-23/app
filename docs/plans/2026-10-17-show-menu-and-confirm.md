# Show the menu in the chat, and ask to confirm it

Status: **done**.

## Context
- Asking the chat to see the menu gets a plain-text list. The preview card only follows a `save_menu` call ([menu preview plan](2026-10-17-menu-preview-in-chat.md)), and showing an unchanged menu saves nothing, so the model writes it out.
- The Menu tab's Confirm button is under the whole week: you scroll to the bottom to reach it.
- After a menu, the chat doesn't say that the shopping list needs a confirmed menu.

## Design
- **`show_menu` tool**, no input. The function checks a menu exists and answers whether it's confirmed, so the model knows whether to ask for confirmation. It writes nothing.
- **Chat**: a `show_menu` call that worked gets the same preview card as a save. The card shows the menu as it stood at that point of the chat: the last successful `save_menu` input or the last `<saved_menu>` copy the server added, whichever came later. The server adds that copy whenever the saved menu changed, so it is current.
- **Prompt**: asked to see the menu, call `show_menu` instead of writing it. After a save, or a show of an unconfirmed menu, say in the same line to confirm it in the Menu tab to get the shopping list.
- **Menu tab**: Confirm button (or "Menú confirmado.") and its error go above the week.

## Steps
1. Save this plan.
2. `supabase/functions/chat/index.ts`: `show_menu` tool and its `runTool` branch.
3. `supabase/functions/chat/prompt.ts`: show and confirm rules, example.
4. `src/Chat.tsx`: `show_menu` previews in `toBubbles`.
5. `src/Menu.tsx`, `src/index.css`: Confirm on top.
6. `npm run build`, `npm run lint`, `npm test`; deploy the function; check in the browser.
7. Docs: `docs/architecture.md` (Chat screen, `chat` function tools, Menu screen), `docs/product.md` (chat and menu).
