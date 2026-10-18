# 0028. Menus in calendar order from tomorrow, named by weekday

- Status: Accepted
- Date: 2026-10-17

## Context
[ADR 0024](0024-agent-builds-the-menu-from-real-products.md) let a menu cover 1 to 7 days: the ones the user asks for, each once, and the whole week otherwise. Two things were still missing ([plan](../plans/2026-10-17-menu-days.md)):
- The chat didn't know what day it was, so "planificame los 3 días que vienen" had no days to name.
- The Menu tab sorted the days Monday-first, so a plan from Saturday to Monday read lunes, sábado, domingo.

We had to decide:
- **How a day is stored.** Options: a date per day, or the weekday key the menu already has.
- **How the chat learns today's date.** Options: in the system prompt, or in the user message.
- **Where a plan starts.** Options: today or tomorrow.

## Decision
- **Weekday keys, not dates, in calendar order.** Each day comes after the one before, counting from the first (sunday, then monday). Gaps are fine ("lunes, miércoles y viernes"), and no day repeats.
  - `menuProblems` checks the order.
  - The array order is the display order: the Menu tab and the chat's card show sábado, domingo, lunes as saved.
  - Saved menus whose days are in order still pass.
- **Today's date goes in the user message**, as a `<today>` block with Montevideo's date (weekday, day, month and year).
  - Like `<saved_profile>`, it's added only when it differs from the last one the chat saw ([ADR 0011](0011-profile-in-each-chat.md)).
  - The system prompt stays frozen, so it caches.
  - The web app hides the block.
- **A week by default, from tomorrow, 7 days at most.**
  - The chat starts tomorrow unless the user says otherwise ("desde hoy", "desde el lunes").
  - It names the days in its first line, and never asks how many.
  - Changing some meals keeps the saved days; a new plan or a new length starts tomorrow again.
- **The price answer the model reads carries the cost per day** (`verdict` in `_shared/offers.ts`), so the chat can say it next to the total. The screens show the same figure ([product.md](../product.md#6-save-money)).

## Consequences
- No migration. The list, the prices and the macros add up any number of days unchanged.
- A menu doesn't know when it's over: a 3-day menu from last week still reads sábado, domingo, lunes. The chat offers a new plan when the user asks about a day the menu doesn't have.
- The time zone is fixed to Montevideo in the `chat` function, which holds while the app only serves Montevideo.
- "Do they come back weekly?" counts lists, and shorter menus make more of them ([open decision](../notes/open-decisions.md)).
- Deploy order: the web app first, then the `chat` function. An older web app would show `<today>` as a message and sort the days Monday-first.
