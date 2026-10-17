# Architecture

Living doc: how the system is *now*. Reasoning lives in [ADRs](adr/), not here.

## Components

- **Web app** (`src/`): a single-page app installed on the phone as a PWA. It talks to Supabase with the public key and the user's login token. Screens: Chat, Menu and List (placeholders), and Profile.
- **Supabase**: one hosted project.
  - Auth: Google's sign-in button first ([ADR 0010](adr/0010-google-leads-sign-in.md)), or a magic link email for now and an emailed code from milestone 6.
  - Postgres (`supabase/migrations/`), with row-level security and an owner policy on every table:
    - `messages`: one ongoing chat per user. `content` holds each message exactly as sent to or returned by Claude, thinking blocks included. The history is append-only and replayed as is.
    - `profiles`: what the AI saved about the user (goal, meals, cooking time, nutritionist's plan, and can't eat / don't like / like / want lists), as one `data` JSON object.
  - Edge Function `chat` (`supabase/functions/chat/`): checks the caller's token, loads the history, calls Claude, streams the reply as plain text, runs the `save_profile` tool, and stores the whole exchange at the end. All database access runs as the user, under row-level security.
- **Claude**: called only from Edge Functions, never from the browser. The system prompt lives in `supabase/functions/chat/prompt.ts`.

## Data flow

1. Sign-in, either way:
   - Google: browser → Google's button → signed ID token → Supabase Auth (`signInWithIdToken`) → session, without leaving the page.
   - Email: browser → Supabase Auth → magic link email → back to the app with a session.
2. Chat: browser → `chat` function (user token) → Claude (streaming) → text streamed back to the browser. `save_profile` calls write `profiles`, and the new turns are appended to `messages`.
3. Screens read `messages` and `profiles` directly from Supabase, limited to the user's own rows.

## Stack
<!-- One line per item, linking its ADR, e.g.: Database: Postgres ([ADR 0002](adr/0002-use-postgres.md)) -->
- Client: installable web app (PWA), Capacitor later ([ADR 0002](adr/0002-pwa-now-capacitor-later.md))
- Framework: Vite + React + TypeScript ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- UI language: Spanish, strings in `src/strings.ts` ([ADR 0006](adr/0006-spanish-ui.md))
- UI design: plain CSS with design tokens in `src/index.css`, pumpkin orange and black, floating glass dock, no CSS framework ([ADR 0009](adr/0009-coral-identity-and-glass-dock.md), [ADR 0011](adr/0011-naranja-zapallo-colors.md), [design.md](design.md))
- Backend: Supabase: auth, Postgres, Edge Functions ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- AI: `claude-sonnet-5-5` at medium effort via the Anthropic SDK ([ADR 0007](adr/0007-sonnet-for-chat.md))
- Hosting: Cloudflare Worker serving the static build ([ADR 0005](adr/0005-cloudflare-workers.md))
- Prices: supermarket websites and SIPC ([ADR 0003](adr/0003-price-sources.md))
