# Numbers switch

Status: **done** in code; the function deploy and `db push` are pending.

## Context
- [Product](../product.md#3-numbers-are-optional): numbers are hidden by default; a switch in the profile shows calories and macros per meal and per day.
- Asked for: the switch, off by default. Asking the chat turns it on or off. Talking in numbers or technical terms (calories, grams of protein, macros) turns it on by itself, with one line telling the user why and that they can go back to no numbers.
- Today nothing in the app knows what a food contains, and the browser can't write `profiles` ([ADR 0014](../adr/0014-client-reads-chat-function-writes.md)).

## Design
- **The switch is `show_numbers` in the profile's `data`**: `null` until someone sets it (off), `true` on, `false` turned off by the user. `false` stops the chat from turning it back on by itself.
- **The chat sets it with `save_profile`**: one more nullable field, sent every time like the rest. The saved profile block already shows the model the current value.
- **The Profile tab sets it with an RPC**, `set_show_numbers(show_numbers boolean)`: security definer, merges that one key into `data`, creates the row if there's none. A column grant can't do it: the switch lives inside `data`, and `data` reaches Claude.
- **Macros come from a fixed table** in `_shared/nutrition.ts`: kcal, protein, carbs and fat per 100 g or 100 ml raw as bought, or per unit, for each catalog food. The Menu tab adds them up per meal and per day. `'other'` foods have no values: totals leave them out and say which.
- **The same table goes in `save_menu`'s food list**, so numbers the chat quotes, or a calorie target it builds to, match the Menu tab.

## Steps
1. Save this plan.
2. `supabase/functions/_shared/nutrition.ts` + test.
3. Migration: `set_show_numbers`.
4. `supabase/functions/chat/index.ts`: `show_numbers` in `save_profile`, nutrition in `save_menu`'s food list. `prompt.ts`: the numbers rules.
5. `src/Profile.tsx`: the switch. `src/Menu.tsx`: macros per meal and per day. `src/strings.ts`, `src/index.css`.
6. `npm run build`, `npm run lint`, `npm test`. Deploy the function, then `db push`; check in the browser.
7. Docs: `docs/product.md`, `docs/architecture.md`, `docs/development.md` (browser writes), ADR 0021 + `docs/adr/README.md`.
