# Shopping list

Status: **built**, not released: steps 9 (release) and 10 (phone check) are pending. Milestone 4 in [milestones](../notes/milestones.md). Builds on [plan and menu](2026-10-17-plan-and-menu.md) and [lock down writes](2026-10-17-lock-down-writes.md) ([ADR 0014](../adr/0014-client-reads-chat-function-writes.md): the client only reads, except named columns). Milestone 5's plan builds on this one.

## Context
Milestone 3 leaves the week in `menus.data`. Each ingredient is a catalog `food` (or `other` + `other_name`) with an `amount` per serving, raw as bought, and its `unit`. Milestone 4 turns that into the **List** tab:
- the week added up, in packs where a food comes in packs, otherwise by weight or count;
- grouped by section, in the order you walk the store;
- what you already have at home, said by chat ("ya tengo arroz", "tengo medio kilo de arroz") or in the list (cross out, or buy less);
- share to WhatsApp or copy.

Raw vs. cooked needs no list code: amounts are already raw ([ADR 0013](../adr/0013-menu-saved-by-a-chat-tool.md)). The prompt gains one line to convert cooked amounts the user gives. One person per account, so each meal is one serving.

Decided with the team:
- **Confirm first.** The list shows only once the menu is confirmed.
- **Meat by weight.** Meat, fish, ham and cheese show a weight, not trays: trays vary and are priced per kg. product.md's example becomes "1,1 kg of rice → 2 × 1 kg".
- **One meaning for crossing out.** It means "I already have this at home", and it's stored in the database. You can say it by chat or do it in the list: cross out, or buy less. There's no separate "in the cart" check; to tick things off in the store, use the WhatsApp list.
- **Marks are cleared by hand.** They survive menu changes and are cleared with a **Lista nueva** button or by telling the chat ("arranco semana nueva").
- **The list is editable.** That makes the "items edited" target measurable. Which edits count is milestone 6's call (see Docs).

## Design
- **Catalog** (`_shared/catalog.ts`):
  - Add `export type Section = 'produce' | 'pantry' | 'meat' | 'dairy'`.
  - Every entry becomes `{ unit, section, pack: number | null }`. `pack` is in the food's unit; `null` means loose or by weight.
  - `pack` values:
    - produce: all `null`;
    - meat, fish, ham and cheese: `null`;
    - eggs: 12;
    - packaged food: typical sizes, e.g. rice 1000, pasta 500, oats 400, oil 900, milk 1000.
  - `shortcut:` comment: sizes are typical, only rice, oats, flour, polenta, oil and milk come from the spikes. Check them in a store before the pilot; milestone 5's seed overrides them per store.
  - Comment: keys are only ever added, never renamed, because saved menus point at them.
  - The `save_menu` schema reads only `unit`, so it doesn't change.
- **`_shared/menu.ts`**: extract the per-ingredient checks (catalog key, `other` has a name, unit matches, including the in-place lowercasing) from `menuProblems` into `export function foodProblems(item, where): string[]`.
  - `menuProblems` calls it, then checks the amount, so `menu.test.ts` passes unchanged.
- **`_shared/list.ts`** (new, plain TS, used by the app and the chat function):
  ```ts
  export type Have = Record<string, number | null> // item id → amount at home, in the item's unit; null = enough, don't buy
  export type Item = { id: string; food: CatalogKey | 'other'; other_name: string | null
                       section: Section | 'other'; unit: Unit; amount: number; pack: number | null }
  export function itemId(food, other_name, unit): string // catalog key, or `other:<unit>:<name trimmed, lowercased>`
  export function buildList(menu: MenuData): Item[]      // week totals for one person, first-seen order
  export function left(item: Item, have: Have): number   // still to buy, unrounded: what milestone 5 prices
  export function toBuy(item: Item, have: Have): number  // left() rounded up to a step; 0 = crossed out
  export function stepHave(item: Item, have: Have, dir: 1 | -1): Have
  ```
  - **`buildList`**:
    - Each meal in `days` adds its recipe's ingredients once, so a repeated recipe adds one serving each time and an unused recipe adds nothing.
    - `amount` is rounded to 2 decimals to clear float noise.
    - `other` items, and keys the catalog no longer has (`Object.hasOwn`), merge by id into section `other`. They never throw.
  - **`left`**: `null` gives 0; otherwise `max(0, amount − have)`.
  - **`toBuy`**: `left()` rounded up to the step, never down (product rule 3). The step is the pack; else 1 for `un`; else 100 for g/ml, or 10 when the amount is under 100 (garlic, oregano).
  - **`stepHave`**: changes what to buy by one step. Reaching 0 becomes `null`; reaching the full menu amount removes the id.
- **Migration** `<ts>_menu_have.sql`: `alter table menus add column have jsonb not null default '{}';`
  - Comment: what the user has at home, written by the List tab and the chat's `update_shopping_list`.
  - Comment: `save_menu` leaves it, and writing it doesn't touch `updated_at`, because milestone 5 reads `updated_at` as the menu's version.
  - `grant update (have) on menus to authenticated;` next to `confirmed_at`'s grant ([ADR 0014](../adr/0014-client-reads-chat-function-writes.md)). A forged `have` only changes the user's own list and never reaches Claude.
- **`chat/index.ts`**: a new strict tool `update_shopping_list`, built with `object()`.
  - **Input**: `{ reset: boolean, items: [{ food (catalog enum + 'other'), other_name, unit, have: number | null }] }`.
  - **Description**:
    - `reset` clears every mark first (a new week);
    - only the foods sent change;
    - `have` is the amount at home in the unit; `null` means enough or don't buy; `0` means buy all of it again;
    - use the food, unit and `other_name` exactly as in the saved menu.
  - **`runTool` branch** (on a `structuredClone(input)`, as `save_menu` does):
    1. `foodProblems` per item, and `have` ≥ 0.
    2. `select('data, have').maybeSingle()`. No row → "No menu yet. Build the menu first."
    3. Reject any item whose `itemId` isn't in `buildList(data)`: "X is not on this week's list. Use the food, unit and other_name exactly as in <saved_menu>." Problems → "Not saved. Fix this and call update_shopping_list again: …".
    4. Start from `reset ? {} : have` and merge (`0` deletes the entry). Then `admin.from('menus').update({ have }).eq('user_id', userId)` (the service-role client, as for the other writes).
  - `shortcut:` read-modify-write, so a tick racing a chat update can lose one. Fine for one person.
  - `tools: [saveProfile, saveMenu, updateShoppingList]`. `have` stays out of `<saved_menu>`, so ticking never re-sends the menu.
- **`chat/prompt.ts`** (resets the prompt cache once):
  - "the shopping list is coming soon" becomes: a List tab builds the shopping list from the confirmed menu, and prices are coming soon.
  - A "Shopping list" section:
    - don't write the list in the chat, point to the List tab;
    - when the user says they have a food, have some of it, or don't want to buy it, call `update_shopping_list` with only those foods, exactly as in the menu;
    - "arranco semana nueva" or "lista nueva" means `reset: true`;
    - confirm in one line.
  - The amounts rule adds: "if the user gives cooked amounts, convert them to raw".
- **`src/List.tsx`** (new, modeled on `Menu.tsx`), with props `session` and `onOpenMenu`:
  - **Loading**: `select('data, confirmed_at, have').maybeSingle()`.
    - A failed load shows `t.menu.loadError`; no menu shows `t.menu.empty`. Both strings are reused.
    - An unconfirmed menu shows `t.list.confirmFirst` and a button that opens the Menu tab.
  - **Top**:
    - **Compartir** and **Copiar**, disabled when nothing is left to buy;
    - **Lista nueva** when `have` isn't empty, which writes `{}`;
    - the hint `t.list.hint` ("Tachá lo que ya tenés en casa.").
  - **Sections**: in `t.list.sections` order, skipping empty ones, each an `<h2>` plus a `<ul>`. Each row is at least 44 px and holds:
    - a `<label>` with a checkbox (aria `t.list.have(name)`; checked when `toBuy === 0`; on → `null`, off → delete the id);
    - the name: `other_name ?? t.foods[food] ?? food`;
    - the quantity;
    - quiet **−** / **+** buttons (`stepHave`). + is disabled at the menu's amount, − when crossed out.
    - Crossed-out rows stay in place, muted and struck through.
  - **Quantity**:
    - packed: `n × qty(pack)`; loose: `qty(toBuy)`;
    - a muted `(menú: qty(amount))` only when that text differs from the buy text;
    - `qty`: g/ml under 1000 as is; from 1000 up in kg/L with up to two decimals and the es-UY comma; `un` as "N u.".
  - **Writes**: set the state, then chain the save on one promise ref, `saving = saving.then(() => update({ have: latest }).eq('user_id', …))`, so two quick taps can't land out of order.
    - On failure it shows `t.list.saveError` and keeps the screen as it is.
    - The next save sends everything.
  - **Shared text**: `t.list.title`, then only what's left to buy: one heading per section, then `- Name: quantity` lines.
  - **`share()`**: `'share' in navigator` → `navigator.share({ text })`, ignoring a cancel. Otherwise `window.open('https://wa.me/?text=' + encodeURIComponent(text))`.
  - **`copy()`**: `navigator.clipboard.writeText` directly in the tap handler, then `t.list.copied` or `t.list.copyError`.
- **`src/App.tsx`**: `{tab === 'list' && <List session={session} onOpenMenu={() => setTab('menu')} />}`, replacing the `t.soon` branch.
- **`src/strings.ts`**:
  - Delete `soon`.
  - Add `menu.units.kg`/`l`.
  - Add `list: { hint, confirmFirst, openMenu, share, copy, copied, copyError, saveError, reset, have(name), less(name), more(name), menuNeeds, title, sections }`.
  - `sections` is `{ produce: 'Frutas y verduras', pantry: 'Almacén', meat: 'Carnes y pescado', dairy: 'Lácteos, fiambres y huevos', other: 'Otros' } satisfies Record<Section | 'other', string>`.
- **`src/index.css`**:
  - `.soon` becomes `.list` in the padding rule.
  - `.list h2` gets its own rule, without `capitalize`.
  - `.list ul` has no bullets.
  - Rows are flex with a gap and a 44 px minimum height.
  - `.list input[type=checkbox] { width: auto; margin: 0 }`.
  - `li:has(:checked)` is muted and struck through.
  - `.list-actions` is a flex row.
  - The −/+ buttons reuse the quiet `.chat button.mic` look: surface background, border, muted color.

Left out:
- Adding items by hand, or buying more than the menu needs. Ask the chat to change the menu instead.
- An "in the cart" check.
- Spanish pack names ("bandeja").
- Prices, stores and choosing the bigger pack (milestone 5).
- Events and "Order it for me" (milestone 6).
- Past lists and offline use.

Risks:
- **Wrong amounts.** The list is only as right as the model's "per serving, raw" amounts. A whole-recipe amount makes a line N× too high.
- **Stale marks.** If nobody taps Lista nueva, last week's "ya tengo arroz" carries into the new week.
- **Wrong item from the chat.** The model may pick a food the menu doesn't use ("aceite": sunflower or olive). The tool rejects it and the model retries with the menu's item.
- **Guessed pack sizes.** A wrong size gives the wrong pack count, but the menu's amount is shown next to it.
- **Duplicates.** An `other` used for a food the catalog has shows up twice.
- **Not tried on a phone.** The share sheet and wa.me haven't been tried in an installed iOS app. Share and clipboard need HTTPS, so test on the deployed URL.

## Steps
1. Save this plan.
2. `catalog.ts`: `Section`, plus `section` and `pack` on every entry.
3. `menu.ts`: extract `foodProblems`; `menu.test.ts` must still pass unchanged.
4. `_shared/list.ts` and `_shared/list.test.ts`. The test covers:
   - a recipe at lunch and dinner Monday to Friday plus one on the weekend, which adds up;
   - an unused recipe, which is absent;
   - egg 0.7 × 10 → exactly 7;
   - " Queso rallado " and "queso rallado" → one item;
   - an unknown key → `other`;
   - `toBuy` for a pack (1100 g → 2000), loose g (1150 → 1200; 35 → 40), `un`, a partial `have`, `null`, and `have` > amount → 0;
   - `left` with a partial `have` (unrounded);
   - `stepHave` down to `null`, and back up to removing the id.
5. `npx supabase migration new menu_have` with the `alter` line and its comments.
6. `chat/index.ts` (the tool and its `runTool` branch) and `chat/prompt.ts`.
7. `strings.ts`, `List.tsx`, `App.tsx`, `index.css`.
8. `npm test`, `npm run build`, `npm run lint`.
9. Release, in this order:
   1. `npx supabase db push`.
   2. Push to `main` and wait for the Cloudflare build.
   3. `npx supabase functions deploy chat`.
10. Phone check, installed PWA on the deployed URL, iPhone and Android:
    - **Empty and unconfirmed.** No menu shows the empty state. An unconfirmed menu asks to confirm. Once confirmed, sections are in order.
    - **Totals.** Check rice, eggs and chicken by hand against the Menu tab: chicken is a weight, rice is packs with "(menú: …)".
    - **Editing.** Cross out 2 items and tap − on 1. Tap fast a few times, then reload: the marks match, and they also show on a second device.
    - **Chat marks.** Say "ya tengo aceite y medio kilo de arroz": oil is crossed out and rice is one pack fewer. Say "arranco semana nueva": the marks are gone.
    - **Cooked amounts.** Say "mi nutricionista me da 150 g de arroz cocido": the menu stores about 50 g dry.
    - **Menu change.** Swap a dinner by chat: the list asks to confirm again, and the marks are kept.
    - **Share and copy.** Compartir to WhatsApp leaves out crossed-out items. Copiar, then paste into Notes.
    - **Errors and looks.** In airplane mode a tick shows the error. Lista nueva works. Dark mode looks right.
11. Docs:
    - **`docs/architecture.md`**:
      - the screens line (List);
      - `menus.have` and its two writers;
      - the chat function runs `update_shopping_list`;
      - the Shared code line: the catalog with sections and packs, the list builder, and `npm test` covers the menu checks and the list;
      - data flow: the List tab builds the list in the browser and writes only `have`.
    - **`docs/product.md`**:
      - §5: sections in walking order; packs vs. weight (rice example); the menu's amount shown; `other` under Otros; waits for Confirm; cross out or buy less, in the list or by chat; marks kept until Lista nueva; share and copy only what's left;
      - §1: you can tell the chat what you already have.
    - **`docs/notes/open-decisions.md`**: which list edits count toward "under 20% of items edited". A cross-out is often the pantry, not a list mistake, so milestone 6's events should record the kind (cross out or −) and the source (list or chat).
    - **`docs/notes/milestones.md`**: reword milestone 4 to include editing and saying what you have by chat, tick it, and link this plan.
    - Milestone 5's plan: its assumption A2 becomes "price `left(item, have)`" (partial marks, not only ticks), and its ADR numbers move past 0017. Tell that plan's session rather than editing its file.
    - **ADR 0017** (0015 and 0016 went to the price catalog), "The shopping list is derived in the browser; only what you have is stored, on the menu row". Alternatives: a stored list, a separate table, localStorage. Add its row to `docs/adr/README.md`.
    - Set this plan's status to done.

## Verification
- `npm test` covers the list math and the existing menu checks. `npm run build` and `npm run lint` are clean.
- The phone check in step 10 covers the end-to-end flow, the chat tool, ordered writes and the release order.
