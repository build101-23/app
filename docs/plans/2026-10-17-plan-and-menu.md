# Plan and weekly menu

Status: **released**; the phone test (step 8.4) is pending. Milestone 3 in [milestones](../notes/milestones.md).

## Context
The chat builds a diet but only as text. Milestone 3 turns it into a structured weekly menu with its own screen. You change a meal or a day by chat or by tapping it, and you confirm the menu.

Decided with the team:
- Ingredients point at a **fixed food catalog** to start with, so the shopping list (milestone 4) and prices (milestone 5) can add up and look up foods by key instead of matching free text. We may revisit it later.
- The menu is **saved as soon as the AI proposes it**, and the Menu tab has a **Confirm** button.

"The plan" is the profile plus the menu. There's no separate plan object.

## Design
- **Food catalog** `supabase/functions/_shared/catalog.ts`: about 50 everyday foods sold in Montevideo, keyed in English (`chicken_breast`, `rice`, `egg`, ...), each with a `unit` of `'g' | 'ml' | 'un'`. It's written as `as const satisfies Record<string, { unit: ... }>`, so `CatalogKey` is the union of real keys. Plain TS with no Deno or DOM globals. The function imports it from `../_shared/catalog.ts`, the documented Supabase pattern. The app imports it from `../supabase/functions/_shared/catalog.ts` (checked: `tsc -b`, `vite` and oxlint accept it). Milestone 4 adds section and pack size, and milestone 5 adds prices.
- **Spanish food names** live in `src/strings.ts` as `foods: Record<CatalogKey, string>`, so the build fails if a food has no name ([ADR 0006](../adr/0006-spanish-ui.md)).
- **Tool `save_menu`** in the chat function, next to `save_profile`. It is strict, and each call replaces the whole week. Every object has all keys required and `additionalProperties: false`, as in `save_profile`.
  ```ts
  { recipes: [{ id: string, name: string, how: string,
                ingredients: [{ food: CatalogKey | 'other', other_name: string | null, amount: number, unit: 'g' | 'ml' | 'un' }] }],
    days: [{ day: 'monday' | ... | 'sunday', meals: [{ slot: string, recipe_id: string }] }] }
  ```
  - A few recipes that repeat, referenced from the days, keep the output short and match the product rule. `recipes` comes first in the schema, so it's generated before the days that point at it.
  - `amount` is per serving, raw as bought, so milestone 4 doesn't need a cooked-to-raw factor.
  - The `food` description is built from the catalog as `key (unit)` lines, so the model sees each unit. It's static per deploy, so it still caches. `other` + `other_name` covers anything outside the catalog and shows up as "not found online" later.
  - Strict mode can't check the rest, so the function does. `food` and `day` are lowercased. Every `food` must be a catalog key or `other`, with the catalog's unit and an `amount > 0`. Every `other` needs a name, every `recipe_id` must exist, and each of the 7 days must appear exactly once. A failed check returns `is_error` with what's wrong, and the model retries.
  - Checked against the documented strict limits: 2 of 20 strict tools, 6 of 16 union-typed parameters, 0 optional parameters.
- **The tool loop branches on `block.name`.** Today every `tool_use` is upserted into `profiles`.
- **Table `menus`**: `user_id` primary key, `data jsonb`, `confirmed_at timestamptz` (null until confirmed), `updated_at`. Same owner RLS policy as `profiles`, which also covers the client's Confirm update. `save_menu` upserts and sets `confirmed_at` back to null, since a changed menu needs confirming again.
- **The menu travels into each chat** the same way the profile does ([ADR 0011](../adr/0011-profile-in-each-chat.md)). When the saved menu's `data` differs from the last `<saved_menu>` block the chat saw, it goes at the start of the new user message. That's how a new chat can change "Tuesday's dinner". Only `data` is serialized, so confirming doesn't re-send it. After a `save_menu` the next message repeats the menu once, about 3k tokens, which ADR 0011 already accepts.
- **Prompt** (`prompt.ts`), still frozen with no per-user content:
  - The menu exists now. Only the shopping list is "coming soon".
  - Once it knows the goal and what the user can't eat, the AI writes one short line, calls `save_menu` with the whole week, then says it's in the Menu tab. It doesn't write the week out in the chat. This replaces the "propose concrete meals" line, the "short list" style line and the example, which today list meals in the chat.
  - Any change, including a profile change that affects the menu (a new can't-eat, meals per day), re-saves the whole week in the same turn.
  - Slots, recipe names and `how` are in the user's language, and `how` is one line.
  - Confirming is the button in the Menu tab. The AI can't confirm.
  - It explains the `<saved_menu>` block, the amounts and `other`.
- **Don't store broken turns** (confirmed bug, `index.ts:131`):
  - An assistant turn with empty content, which can follow a tool result, is dropped and the rest is stored. The client already shows "No pude responder eso".
  - A turn that stopped for any reason other than `tool_use` while holding a `tool_use` (cut off at `max_tokens`, or a refusal) stores nothing and errors. The client gives the text back to resend.
  - Either one, stored, would make every later request in that chat fail.
- **Menu tab** (`src/Menu.tsx`, modeled on `Profile.tsx`):
  - It reads `menus`. With no menu it shows "Pedile un menú al chat", and a failed load shows an error, not an empty menu.
  - Each day is a heading with a **Cambiar** button. Each meal is a `<details>`: the summary is the slot and recipe name, and the body shows the ingredients (amount, unit, name), the instructions and its own **Cambiar** button.
  - Cambiar switches to the Chat tab with a draft ready to finish: "Cambiame el lunes: " or "Cambiame la cena del lunes: ".
  - A **Confirmar menú** button sets `confirmed_at`. Once confirmed, it shows "Menú confirmado".
- **App shell**:
  - `Shell` keeps a `chatDraft` that Menu sets before switching tabs. Chat takes it as its initial draft, and the nav clears it.
  - The nav is disabled while a chat reply is in flight, through an `onBusy` callback from Chat. Otherwise leaving Chat during a long `save_menu` hides the turn and invites a resend. This also fixes the confirmed "switching tabs mid-reply" bug.
- **Chat**: `toBubbles` hides every `<saved_` block, not only the profile.
- **Strings** (`src/strings.ts`): a `menu` block with the empty and load-error texts, Cambiar, Confirmar menú, Menú confirmado, day names (`monday: 'lunes'`, ...; headings capitalized with CSS), unit labels (`un: 'u.'`) and the draft templates. Plus `foods`.

Left out: calories and macros (the numbers switch), past weeks, dates, editing the menu by hand, and the "first menu confirmed with 2 changes or fewer" metric. That metric needs a confirm event (milestone 6 adds events), with the changes counted from `save_menu` calls in `messages`.

Risks to check on the first deploy:
- The strict schema compiles with a 50-key enum inside nested arrays. If the API refuses it, `food` becomes a plain string, which the function already validates.
- Generation time. The function has a 150 s wall clock on the Free plan (400 s paid), covering the whole exchange: the short line, `save_menu`, the reply, and any `is_error` retry. Time a full week. If it comes close, the prompt caps the number of recipes.

## Steps
1. Save this plan.
2. `supabase/functions/_shared/catalog.ts` with about 50 foods, and their names in `src/strings.ts`.
3. Migration `supabase/migrations/<timestamp>_menus.sql`.
4. `supabase/functions/chat/index.ts`: `save_menu` tool and its validation, branching on the tool name, the `<saved_menu>` block, and the broken-turn guard.
5. `supabase/functions/chat/prompt.ts`: menu instructions, rewritten example, `<saved_menu>`, and the "coming soon" line.
6. `src/Menu.tsx`, `src/App.tsx`, `src/Chat.tsx`, `src/strings.ts`, `src/index.css`.
7. `npm run build`, `npm run lint`.
8. Release, in this order:
   1. `npx supabase db push`.
   2. Push to `main` and wait for the Cloudflare build to finish. The client must hide `<saved_menu>` before the function sends it.
   3. `npx supabase functions deploy chat`.
   4. Try it on a phone: a new user, a week, a change from the Menu tab and one by chat, then confirm.
9. Docs:
   - `docs/architecture.md`: the screens line, `menus`, `save_menu`, the catalog, the menu block, and the data flow (`save_menu` writes `menus`, the client writes `confirmed_at`).
   - `docs/product.md`:
     - "How it works": the AI proposes a weekly menu in the Menu tab, and you change it and confirm it. The plan is the profile plus the menu.
     - Section 1: the meals go to the Menu tab.
   - `docs/notes/milestones.md`: tick milestone 3 and link this plan. Note on milestone 4 that amounts are already raw as bought.
   - ADR 0013, "Weekly menu saved by a chat tool, keyed to a fixed food catalog": the catalog, saving on proposal with a confirm button, and the `<saved_menu>` block (pointing to ADR 0011). Add its row in `docs/adr/README.md`.
   - Set this plan's status to done.
