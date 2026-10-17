# Architecture

Living doc: how the system is *now*. Reasoning lives in [ADRs](adr/), not here.

## Components

- **Web app** (`src/`): a single-page app installed on the phone as a PWA. It talks to Supabase with the public key and the user's login token. Screens: Chat, Menu (the week, a Confirm button, and Cambiar buttons that hand a draft to the chat), List (placeholder) and Profile.
- **Supabase**: one hosted project.
  - Auth: magic link email for now, an emailed code from milestone 6.
  - Postgres (`supabase/migrations/`), with row-level security on every table. Users read only their own rows. They write only `conversations` and `menus.confirmed_at`; the `chat` function writes the rest ([ADR 0014](adr/0014-client-reads-chat-function-writes.md)):
    - `conversations`: the user's chats, with a title (the first message) and `updated_at` for sorting.
    - `messages`: the turns of each conversation. `content` holds each message exactly as sent to or returned by Claude, thinking blocks included. The history is append-only and replayed as is.
    - `profiles`: what the AI saved about the user (goal, meals, cooking time, nutritionist's plan, and can't eat / don't like / like / want lists), as one `data` JSON object.
    - `menus`: the weekly menu the AI saved, one per user, as one `data` JSON object (recipes, and the days that point at them), plus `confirmed_at`, set by the Menu tab and cleared by every save.
  - Edge Function `chat` (`supabase/functions/chat/`): checks the caller's token, loads that conversation's history, adds the saved profile and menu to the new message when they changed ([ADR 0011](adr/0011-profile-in-each-chat.md), [ADR 0013](adr/0013-menu-saved-by-a-chat-tool.md)), calls Claude, streams the reply as plain text, runs the `save_profile` and `save_menu` tools, and stores the whole exchange at the end. Reads run as the user, under row-level security. Writes use the service-role key and name the user's id from the verified token. After 100 user turns in 24 hours it answers 429 without calling Claude.
- **Shared code** (`supabase/functions/_shared/`): the food catalog, and the menu's shape and checks. Plain TS imported by both the `chat` function and the web app; `npm test` covers the checks.
- **Claude**: called only from Edge Functions, never from the browser. The system prompt lives in `supabase/functions/chat/prompt.ts`.

## Data flow

1. Sign-in: browser → Supabase Auth → magic link email → back to the app with a session.
2. Chat: the browser creates a `conversations` row for a new chat, then → `chat` function (user token, conversation id) → Claude (streaming) → text streamed back to the browser. The function writes: `save_profile` calls write `profiles`, `save_menu` calls write `menus`, and the new turns are appended to `messages`.
3. Screens read `conversations`, `messages`, `profiles` and `menus` directly from Supabase, limited to the user's own rows. The Menu tab's Confirm button writes `menus.confirmed_at`, the only column of `menus` the browser may change.

## Stack
<!-- One line per item, linking its ADR, e.g.: Database: Postgres ([ADR 0002](adr/0002-use-postgres.md)) -->
- Client: installable web app (PWA), Capacitor later ([ADR 0002](adr/0002-pwa-now-capacitor-later.md))
- Framework: Vite + React + TypeScript ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- UI language: Spanish, strings in `src/strings.ts` ([ADR 0006](adr/0006-spanish-ui.md))
- Backend: Supabase: auth, Postgres, Edge Functions ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- AI: `claude-sonnet-5-5` at medium effort via the Anthropic SDK ([ADR 0007](adr/0007-sonnet-for-chat.md))
- Hosting: Cloudflare Worker serving the static build ([ADR 0005](adr/0005-cloudflare-workers.md))
- Prices: supermarket websites and SIPC ([ADR 0003](adr/0003-price-sources.md))
