# 0021. The numbers switch lives in the profile; macros come from a fixed table

- Status: Accepted
- Date: 2026-10-17

## Context
Numbers are hidden by default, and a switch in the profile shows calories and macros per meal and per day ([product](../product.md#3-numbers-are-optional)). Both the chat (when asked, or when the user starts talking in numbers) and the Profile tab set it. The browser can't write `profiles` ([ADR 0014](0014-client-reads-chat-function-writes.md)), and nothing in the app knew what a food contains ([plan](../plans/2026-10-17-numbers-switch.md)).

We had to decide:
- **Where the switch lives.** Options: a key in `profiles.data`, or its own column.
- **How the browser sets it.** Options: a column grant, or a security-definer RPC.
- **Where the macros come from.** Options: the model writes them into `save_menu`, or a fixed table per catalog food, added up in the browser.

## Decision
- **`show_numbers` in `profiles.data`**: `null` never set (off), `true` on, `false` turned off by the user, which stops the chat from turning it back on by itself. The chat sets it through `save_profile`, which sends it every call, and sees it in the saved profile block like the rest of the profile.
- **The Profile tab calls `set_show_numbers(boolean)`**, a security-definer function that merges that one key into `data` and creates the row if the chat hasn't. A column grant can't reach a key inside `data`, and granting `data` would let the browser put anything in front of Claude.
- **Macros from a fixed table** (`_shared/nutrition.ts`): kcal, protein, carbs and fat per 100 g or 100 ml raw as bought, or per unit, for each catalog food. The Menu tab adds them up, like the shopping list ([ADR 0017](0017-shopping-list-derived-in-the-browser.md)). The same values are in `save_menu`'s food list, so numbers the chat quotes or builds to match the Menu tab. `'other'` foods have no values: totals leave them out and name them.

## Consequences
- A third, narrow browser write: one boolean.
- `save_profile` must echo `show_numbers` on every call, so a model slip, or a save from a view older than a toggle made mid-turn, can flip it.
- The numbers are rounded table values, about ±15%, not the products we price. Replace them with label data once catalog foods are matched to products.
- A menu heavy on `'other'` foods shows low totals; the line says which foods it left out.
- `save_menu`'s tool definition grows by about 1,000 tokens, all cached.
