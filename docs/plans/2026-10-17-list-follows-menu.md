# The shopping list follows the menu, and shows in the chat

Status: **done** in code; the function deploy, the merge to `main` and `db push` are pending, in that order.

## Context
- Today the list shows only in the List tab, after the Menu tab's "Confirmar menú" button. Every `save_menu` clears `menus.confirmed_at`. The chat may not write the list or quote prices.
- Asked for: no confirm step. A saved menu always has its list, and every menu change changes what to buy. What you have at home changes only the list, never the menu. "Confirmar" sounds like a payment and scares people.
- In the chat: after the menu card, the AI says the list is ready too and offers to show it. Shown, the list is a card with what to buy and the total at the end, then "Avisame qué tenés en casa y te la ajusto". Plain-language edits ("tengo dos bananas", "sacame esto", "reducime esto", "cambiame esto") update the card and its total. A change that needs a menu change updates the menu in the background, and the AI says so in one line.
- The total lives in the card, worked out like the List tab. The AI never writes prices.

## Design
- **No confirm step.** The Menu tab loses its Confirm button, and the List tab lists any saved menu. `save_menu` stops clearing `confirmed_at`. After the function and the web app are live, a migration drops the column.
- **`show_shopping_list` tool**, with no input, writes nothing. The web app shows the list as a card under the call. `update_shopping_list` shows it too.
- **The model sees the list's numbers, never prices.** After a message's tool calls have run, if a list tool succeeded, the function appends the list to the last one's result. Each item line has the week's amount, what's at home and what the card buys (`listLines` in `_shared/list.ts`), so "comprá solo 500 g" or "la mitad" start from real numbers. Only numbers on list items get through. The browser can write any JSON into `have`, so other marks count as none.
- **The card is live.** The chat loads the `menus` row along with the messages. It draws the list card from that row, and only at the last successful list call, because older cards would repeat it. A turn that shows the list hides its menu cards: the menu changed in the background, and the reply says so.
- **Card content:**
  - the List tab's share text;
  - the tab's chosen total, in bold;
  - how many products weren't found;
  - the example-prices label;
  - "Ver lista".
  - Nothing to buy → one line, no total.

## Steps
1. Save this plan.
2. `supabase/functions/_shared/list.ts`: `listLines` + test.
3. `supabase/functions/chat/index.ts`: `show_shopping_list`, the list in results, no `confirmed_at`, tool text. `prompt.ts`: the list rules, no confirm step.
4. `src/List.tsx` (`listText`, `ListPreview`, no confirm gate), `src/Chat.tsx` (live card), `src/Menu.tsx` (no Confirm), `src/App.tsx`, `src/strings.ts`, `src/index.css`.
5. `npm run build`, `npm run lint`, `npm test`.
6. Docs:
   - `docs/product.md`;
   - `docs/notes/open-decisions.md`: the first-plan metric loses its confirm event;
   - `docs/architecture.md`, `docs/development.md`, `docs/notes/milestones.md`;
   - ADR 0022 + `docs/adr/README.md`.
7. Migration dropping `menus.confirmed_at` (`supabase/migrations/20261017225703_drop_menu_confirmed_at.sql`).
8. Deploy, in this order:
   1. `npx supabase functions deploy chat`;
   2. merge to `main` (web app);
   3. `npx supabase db push`, once the old web app is gone.

   Then check in the browser.
