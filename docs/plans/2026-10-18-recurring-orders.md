# Recurring orders

## Context
The roadmap has "scheduled orders" and "repeat last week's order with one tap". The app doesn't place orders yet: in the pilot we place them by hand for whoever asks ([product.md](../product.md#users)). So the first step is to let the user say "repeat this order" and see when the next one is, in the Menu tab and from the chat, and keep it in the database where we can read it. Kept simple on purpose: one interval, no day-of-week or time settings.

An order here is the saved menu's shopping. It repeats every as many days as the menu lasts: a week for a 7-day menu, every 4 days for a 4-day one.

## Approach

### 1. Data (`supabase/migrations/…_menu_repeat.sql`)
- Two columns on `menus`: `repeat_every smallint` (1 to 28 days, null when it doesn't repeat) and `repeat_from date` (the day the repeat was set, the first order). A check keeps both null or both set.
- The browser may update both, like `have` (column grants, ADR 0014). `save_menu`'s upsert leaves them alone.

### 2. Next order date (`supabase/functions/_shared/repeat.ts`, with tests)
- `nextOrder(from, every, today)`: the first `from + k × every` on or after today, k ≥ 1, as `YYYY-MM-DD`. On the day it's set, the next one is `every` days later.
- `todayInMontevideo()`: today as `YYYY-MM-DD`, the same in the browser and the function.

### 3. Menu tab (`src/Menu.tsx`, `src/strings.ts`, `src/index.css`)
- A card on top of the days. Off: "Repetir este pedido cada N días" button (N = the menu's days). On: "Se repite cada N días · próximo pedido: sábado 25 de octubre" and a "Dejar de repetir" button.
- Writes `repeat_every` and `repeat_from` (today) straight to `menus`; a failed save shows an alert and keeps the old state.

### 4. Chat (`supabase/functions/chat/index.ts`, `prompt.ts`)
- New strict tool `set_repeat { every_days: integer | null }`: null stops it, otherwise 1 to 28. Needs a saved menu. Sets `repeat_from` to today in Montevideo.
- A `<saved_repeat>` block, sent like the others when it changes: "every 7 days, next order Saturday, October 25, 2026" or "off". The web app already hides `<saved_…>` blocks.
- Prompt: when the user wants the order to repeat ("que se repita", "pedido recurrente", "todas las semanas"), call `set_repeat` with the menu's number of days unless they say another interval; build the menu first if there is none. One line after it, with the next date. Stop it when they ask.
- Step label `set_repeat: Programando tu pedido…`.

### 5. Fixture (`src/dev/fixture.ts`)
- `repeat=on` starts with a weekly repeat; default off. Updates already merge into the row.

### Shortcuts
- Nothing is ordered on the date yet, and the list isn't reset: the date is shown and stored, and we place the order by hand. Automating it (a scheduled job that starts a new list or fills the cart) comes later.
- The interval is set when the repeat is turned on. A later menu with another number of days keeps the old interval until it's turned on again or changed in the chat.
- A menu that isn't 7 days long repeats on other weekdays than its day names.

## Docs
- `docs/product.md`: a recurring orders section; take scheduled orders off "Out".
- `docs/architecture.md`: the new columns, what the browser writes, the `set_repeat` tool.
- `docs/notes/roadmap.md`: scheduled orders started; automating them is next.
- ADR 0039 (recurring order stored on the menu, interval = the menu's days), and `docs/adr/README.md`.
