# 0039. A recurring order is stored on the menu, every as many days as the menu lasts

- Status: Accepted
- Date: 2026-10-18

## Context
Users want the same shopping to come back on its own: "que se repita", "todas las semanas". The roadmap has scheduled orders, but the app doesn't place orders yet; in the pilot we place them by hand ([plan](../plans/2026-10-18-recurring-orders.md)). We had to decide:
- **Where it lives.** Options: a new `orders` table with its own rows and schedule, or two columns on the user's one `menus` row.
- **How often.** Options: a weekday and time picker, or an interval in days.
- **Who sets it.** The Menu tab, the chat, or both.

## Decision
- **Two columns on `menus`**: `repeat_every` (1 to 28 days) and `repeat_from` (the day it was set), both null when it doesn't repeat. There's one menu per user, so there's one order to repeat. `save_menu` leaves them, so changing a meal keeps the repeat.
- **An interval in days, the menu's length by default**: a 7-day menu repeats weekly, a 4-day one every 4 days. The next order is the first `repeat_from + k × repeat_every` on or after today (`_shared/repeat.ts`). No weekday or time settings for now.
- **Both set it.** The Menu tab has a "Repetir pedido" button and "Dejar de repetir", writing the two columns directly (column grants, like `have`, [ADR 0014](0014-client-reads-chat-function-writes.md)). The chat's `set_repeat` tool does the same and can take another interval ("cada dos semanas"); it reads the current state from a `<saved_repeat>` block.

## Consequences
- Simple to show and to read back: who wants a recurring order, how often and when the next one is, in one query.
- Nothing happens on the date yet: no order is placed and the list isn't reset. Automating it needs a scheduled job later, which can read these columns.
- The interval is fixed when set: a new menu with another number of days keeps it, and the chat offers to match it. A menu that isn't 7 days repeats on other weekdays than its day names.
- An `orders` table becomes necessary once orders are placed for real (history, status, several stores); these columns then become its schedule.
