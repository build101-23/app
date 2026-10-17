# 0022. The shopping list follows the menu, and shows in the chat

- Status: Accepted
- Date: 2026-10-17

## Context
Users want to go over the shopping list in the chat and fix it in plain language ("tengo dos bananas", "sacame esto", "cambiame la carne por pollo"), with the total in view ([plan](../plans/2026-10-17-list-follows-menu.md)). Until now the list showed only in the List tab, after a "Confirmar menú" button in the Menu tab ([ADR 0013](0013-menu-saved-by-a-chat-tool.md)). Every menu change undid the confirmation, and the chat could neither show the list nor quote prices. "Confirmar" also reads like a payment, which scares people.

We had to decide:
- **Whether to keep a confirm step.** Options: keep it and let the chat confirm through a tool, or drop it so a saved menu always has its list.
- **What the chat's list card shows.** Options: a copy saved with each tool call, or the menu and marks as saved now.
- **What the model sees.** Options: nothing new; the list as numbers; the list with prices.

## Decision
- **No confirm step.** A saved menu always has its shopping list, and every menu change changes it. What the user has at home (`menus.have`) only changes the list, never the menu. `menus.confirmed_at` is dropped. The Menu tab has no Confirm button, and the List tab lists any saved menu.
- **The chat shows the list as a card** under a `show_shopping_list` call (a new tool that writes nothing) or a saved `update_shopping_list` call. The card shows:
  - what's left to buy, the same text Share sends;
  - the List tab's chosen total;
  - the example-prices label;
  - a button to the List tab.
- **The card is live.** The chat reads the `menus` row when it loads its messages and draws the card from it, like the List tab. Only the last card in a chat shows, since older ones would repeat it. Once the list has been shown, a later turn that shows it again hides the menu previews it saved: the menu changed in the background, and the reply says what changed.
- **The model gets the list as numbers, never prices.** In each round, the last successful list call's result ends with one line per item: the week's amount, what's at home, and what the card buys (`listLines` in `_shared/list.ts`). Relative edits ("la mitad", "comprá solo 500 g") start from real numbers. Totals stay in the browser.
- **A list request that changes what they eat is a menu change.** The model calls `save_menu`, shows the list again, and says in one line what changed in the menu.

## Consequences
- One less step between the menu and the list, and no wording that sounds like a payment.
- The "plans people accept" metric loses its event: what counts as accepting a plan is now an [open decision](../notes/open-decisions.md).
- `menus.have` now reaches Claude, which [ADR 0017](0017-shopping-list-derived-in-the-browser.md) said it never would. The browser can write any JSON there, so only numbers on this week's items get through. Anything else counts as nothing at home. A forged `have` can't add text or tokens.
- The model's view of the list is the last one a tool gave it. Marks changed in the List tab after that aren't in it until the next list call. For relative edits ("la mitad"), the model shows the list again first, which costs a round. Edits that name an amount ("tengo 300 g") aren't affected. If that extra round hurts, send the list into each turn the way `<saved_menu>` is sent.
- An old chat shows today's list, not the one it had then.
- When real prices replace the example ones ([ADR 0019](0019-example-prices-until-matched.md)), the chat's card needs the same loader as the List tab. Both live in `src/List.tsx`.
- Deploy order: the `chat` function, then the web app, then `db push` drops `confirmed_at`. The old web app still reads that column.
