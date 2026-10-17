# Lock down writes and cap chat turns

Status: **released**; trying it with a real user (step 6.4) is pending. Must ship before the pilot (milestone 6 in [milestones](../notes/milestones.md)).

## Context
The owner policies on `messages`, `profiles` and `menus` are `for all`. Any signed-in user can INSERT or UPDATE their own rows straight through the REST API with the publishable key. That lets them:
- forge chat history (fake assistant turns, fake tool results),
- skip the 4000-character limit in the `chat` function by inserting a huge message,
- make `chat` replay that huge history to Claude on our key.

Sign-up is open and there's no per-user cap, so one account can run up the Anthropic bill.

## Design
- **The client only reads `messages`, `profiles` and `menus`.** A new migration replaces each `for all` owner policy with a `for select` one. With row-level security on and no insert, update or delete policy, those writes are refused.
- **The client keeps its two legitimate writes:**
  - `conversations` stays `for all`: the browser creates the row for a new chat. Its `title` never reaches Claude.
  - `menus.confirmed_at` (the Confirm button in `src/Menu.tsx`): an owner `for update` policy, plus a column-level grant. `revoke update on menus from anon, authenticated`, then `grant update (confirmed_at) on menus to authenticated`. Three lines, and `Menu.tsx` stays as is. A security-definer RPC would be a new function plus a client change.
- **The `chat` function writes with the service-role key.** A second client built from `SUPABASE_SERVICE_ROLE_KEY` (provided to every Edge Function) does the `profiles` and `menus` upserts, the `messages` insert and the `conversations.updated_at` bump. The service role skips row-level security, so every write names its row: `user_id` from the verified token, and the conversation id only after the user's own client found it. Reads stay on the user's token, so row-level security still scopes them.
- **Daily cap: 100 user turns in the last 24 hours**, counted from `messages` under the user's token. A user turn is a `role = 'user'` row whose first block is text. Tool results are stored as user rows too, but they start with a `tool_result` block. Over the cap, `chat` returns 429 before calling Claude.
  - A rolling 24 hours needs no time zone.
  - Turns are stored only once the reply finishes, so parallel requests all pass the check. Accepted for the pilot, with a `shortcut:` comment: a determined user can also sign up again. Upgrade to an atomic counter if abuse shows up.
- **Chat tab**: a 429 shows "Llegaste al límite de mensajes por hoy. Probá de nuevo mañana." (`t.chat.limit`) instead of the generic error. The text goes back into the box, as with any failed send.

Left out: a cap on new accounts or conversations, a `title` length limit, and a cap on history length.

## Steps
1. Save this plan.
2. Migration `supabase/migrations/<timestamp>_read_only_tables.sql`.
3. `supabase/functions/chat/index.ts`: service-role client for the writes, explicit `user_id` on `messages`, the daily cap.
4. `src/Chat.tsx`, `src/strings.ts`: the limit message.
5. `npm run build`, `npm run lint`, `npm test`. Run the migration in a throwaway Postgres (PGlite) with Supabase's roles stubbed, and check what `authenticated` can and can't write.
6. Release, in this order (needs the team's OK):
   1. `npx supabase functions deploy chat`. The new function works under the old policies too.
   2. `npx supabase db push`. Pushing first would break the chat: the old function writes `messages` with the user's token, which the new policies refuse.
   3. Push to `main` (Cloudflare deploys the limit message). Order doesn't matter for this one.
   4. Try it: send a message, change the menu by chat, confirm the menu. Then check that a direct `insert` into `messages` with the publishable key and a user token is refused.
7. Docs:
   - `docs/architecture.md`: who writes what (the client reads, plus `conversations` and `menus.confirmed_at`; `chat` writes the rest with the service role), and the cap.
   - `docs/development.md`: the read-only owner policy convention, the service-role key, and "deploy the function before `db push`" when a migration takes away a write the old function uses.
   - ADR 0014 "The client only reads; the chat function writes, under a daily cap", and its row in `docs/adr/README.md`.
   - Set this plan's status to done.
