# Architecture

Living doc: how the system is *now*. Reasoning lives in [ADRs](adr/), not here.

## Components

- **Web app**: a single-page app installed on the phone as a PWA. It talks to Supabase with the public key only.
- **Supabase**: one hosted project. Auth (sign-in with an emailed code), Postgres with row-level security on every table, and Edge Functions for anything that needs a secret.
- **Claude**: called only from Edge Functions, never from the browser.

## Data flow

Browser → Supabase (auth and data, protected by row-level security) → Edge Function → Claude.

## Stack
<!-- One line per item, linking its ADR, e.g.: Database: Postgres ([ADR 0002](adr/0002-use-postgres.md)) -->
- Client: installable web app (PWA), Capacitor later ([ADR 0002](adr/0002-pwa-now-capacitor-later.md))
- Framework: Vite + React + TypeScript ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- Backend: Supabase: auth, Postgres, Edge Functions ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- AI: Claude via the Anthropic SDK ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- Prices: supermarket websites and SIPC ([ADR 0003](adr/0003-price-sources.md))
