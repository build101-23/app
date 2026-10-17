# 0017. The shopping list is derived in the browser; only what you have is stored

- Status: Accepted
- Date: 2026-10-17

## Context
Milestone 4 turns the confirmed weekly menu into a shopping list ([plan](../plans/2026-10-17-shopping-list.md)). The user can say what they already have at home, in the list (cross out, or buy less) or in the chat ("ya tengo arroz"), and that must survive reloads, devices and menu changes.

We had to decide:
- **Where the list lives.** Options: store a list row each time the menu changes, or work it out from the menu whenever it's shown.
- **Where "I have this" lives.** Options: a new table, a column on the menu row, or the browser's storage.
- **What a mark means.** Options: "ticked" (on or off), or how much you have at home.

## Decision
- **The list is never stored.** `_shared/list.ts` builds it from `menus.data` and the catalog's sections and pack sizes, in the browser, every time. The chat function uses the same code to check what the model marks.
- **Marks are one `have` JSON column on `menus`**: item id → amount at home in the item's unit, or `null` for "enough, don't buy it". The List tab writes it through a column-level grant, like `confirmed_at` ([ADR 0014](0014-client-reads-chat-function-writes.md)). The chat's `update_shopping_list` tool writes it with the service role, and sends only the foods that change, so the model never needs to see the saved marks.
- **`save_menu` leaves the marks**, so swapping a dinner keeps "ya tengo aceite". They're cleared by hand: "Lista nueva" in the List tab, or `reset` from the chat.

## Consequences
- Nothing to keep in sync: a menu change shows up in the list at once, and milestone 5 prices the same items by catalog key.
- An amount, not a tick, covers "I have half a kilo" and "buy one pack less" with one meaning, and stays right when the menu's amounts change.
- Marks can go stale: if nobody taps "Lista nueva", last week's "ya tengo arroz" carries into the next week.
- A user can write any JSON object into their own `have` through the API. It only shapes their own list and never reaches Claude.
- The chat's read-then-write can lose a tick made in the List tab at the same moment. Accepted for one person per account.
