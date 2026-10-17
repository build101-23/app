# Architecture

Living doc: how the system is *now*. Reasoning lives in [ADRs](adr/), not here.

## Components

- **Web app** (`src/`): a single-page app installed on the phone as a PWA. It talks to Supabase with the public key and the user's login token. Screens: Chat (with a preview of each menu it saved or showed and a button to the Menu tab), Menu (a Confirm button above the week, and Cambiar buttons that hand a draft to the chat), List (the confirmed menu added up into a shopping list by section, with what you have at home crossed out or reduced, and share or copy; on top, where to buy it by the store rule) and Profile.
- **Supabase**: one hosted project.
  - Auth: magic link email for now, an emailed code from milestone 6.
  - Postgres (`supabase/migrations/`), with row-level security on every table. Users read only their own rows, except the price catalog below. They write only `conversations`, `menus.confirmed_at` and `menus.have`; the `chat` function writes the rest ([ADR 0014](adr/0014-client-reads-chat-function-writes.md)):
    - `conversations`: the user's chats, with a title (the first message) and `updated_at` for sorting.
    - `messages`: the turns of each conversation. `content` holds each message exactly as sent to or returned by Claude, thinking blocks included. The history is append-only and replayed as is.
    - `profiles`: what the AI saved about the user (goal, meals, cooking time, nutritionist's plan, and can't eat / don't like / like / want lists), as one `data` JSON object.
    - `menus`: the weekly menu the AI saved, one per user, as one `data` JSON object (recipes, and the days that point at them), plus `confirmed_at`, set by the Menu tab and cleared by every save, and `have`: what the user has at home for the shopping list, written by the List tab and by the `update_shopping_list` tool, kept across menu saves ([ADR 0017](adr/0017-shopping-list-derived-in-the-browser.md)).
  - The price catalog ([ADR 0016](adr/0016-price-catalog-one-row-per-product-per-chain.md)) is readable by any signed-in user, and only the scraper writes it:
    - `stores`: the four chains (Devoto, Géant, Disco, Ta-Ta).
    - `scrape_runs`: one per chain per scraper run, with the branch or sales channel its prices belong to (`price_context`) and counters.
    - `store_products`: one row per product per chain, with the latest price, the package size, `unit_price` (per kg, liter or unit) and `checked_at`.
    - `price_changes`: each price a product has had, written by a trigger when a product is first read and when its price changes.
    - `upsert_store_products(rows)`: the scraper's only way to write, callable only with a secret key. It holds the merge rules.
  - Edge Function `chat` (`supabase/functions/chat/`): checks the caller's token, loads that conversation's history, adds the saved profile and menu to the new message when they changed ([ADR 0011](adr/0011-profile-in-each-chat.md), [ADR 0013](adr/0013-menu-saved-by-a-chat-tool.md)), calls Claude, streams the reply as plain text, runs the `save_profile`, `save_menu`, `show_menu` (writes nothing; says whether the menu is confirmed) and `update_shopping_list` tools, and stores the whole exchange at the end. Reads run as the user, under row-level security. Writes use the service-role key and name the user's id from the verified token. After 100 user turns in 24 hours it answers 429 without calling Claude.
- **Shared code** (`supabase/functions/_shared/`): the food catalog (with each food's section and usual pack size), the menu's shape and checks, the shopping list builder (`list.ts`), the store rule (`stores.ts`) and the example prices (`prices.ts`, temporary: deleted per [ADR 0019](adr/0019-example-prices-until-matched.md)). Plain TS imported by the `chat` function and the web app (the store rule and prices only by the web app); `npm test` covers the menu checks, the list math, the store rule and the example prices.
- **Claude**: called only from Edge Functions, never from the browser. The system prompt lives in `supabase/functions/chat/prompt.ts`.
- **Price scraper** (`scraper/`, Python): a job run by hand from a dev machine ([ADR 0015](adr/0015-price-scraper-python-job-with-time-budget.md), [ADR 0018](adr/0018-gdu-listings-and-food-pages.md)). It reads Ta-Ta's search API, and the Devoto, Géant and Disco sites' category and brand pages plus a few product pages per food, following [ADR 0008](adr/0008-how-we-read-supermarket-sites.md), and saves through Supabase's REST API with its own secret key.

## Data flow

1. Sign-in: browser → Supabase Auth → magic link email → back to the app with a session.
2. Chat: the browser creates a `conversations` row for a new chat, then → `chat` function (user token, conversation id) → Claude (streaming) → text streamed back to the browser. The function writes: `save_profile` calls write `profiles`, `save_menu` calls write `menus.data`, `update_shopping_list` calls write `menus.have`, and the new turns are appended to `messages`. When the stream ends, the browser reloads the chat's messages, so it sees the `save_menu` and `show_menu` calls it shows as previews. A `show_menu` preview is the latest menu in the chat before it: a saved `save_menu` input or the server's `<saved_menu>` copy.
3. Screens read `conversations`, `messages`, `profiles` and `menus` directly from Supabase, limited to the user's own rows. The Menu tab's Confirm button writes `menus.confirmed_at`. The List tab builds the list in the browser from `menus.data` and the catalog, and writes `menus.have`. Those are the only columns of `menus` the browser may change. The List tab also prices what's left to buy, in the browser, with the example prices.
4. Prices: `python -m scraper` → supermarket sites (1 request per second per site, 25 minutes at most) → `upsert_store_products` in batches → `store_products`, and `price_changes` through the trigger. One `scrape_runs` row per chain records how the run went.

## Stack
<!-- One line per item, linking its ADR, e.g.: Database: Postgres ([ADR 0002](adr/0002-use-postgres.md)) -->
- Client: installable web app (PWA), Capacitor later ([ADR 0002](adr/0002-pwa-now-capacitor-later.md))
- Framework: Vite + React + TypeScript ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- UI language: Spanish, strings in `src/strings.ts` ([ADR 0006](adr/0006-spanish-ui.md))
- Backend: Supabase: auth, Postgres, Edge Functions ([ADR 0004](adr/0004-vite-react-supabase-claude.md))
- AI: `claude-sonnet-5-5` at medium effort via the Anthropic SDK ([ADR 0007](adr/0007-sonnet-for-chat.md))
- Hosting: Cloudflare Worker serving the static build ([ADR 0005](adr/0005-cloudflare-workers.md))
- Prices: example prices bundled with the app until catalog foods are matched to the price catalog ([ADR 0019](adr/0019-example-prices-until-matched.md)); real ones from supermarket websites and SIPC ([ADR 0003](adr/0003-price-sources.md)), read by a Python job ([ADR 0015](adr/0015-price-scraper-python-job-with-time-budget.md))
- CI: GitHub Actions on Tenki runners ([ADR 0020](adr/0020-ci-on-tenki-runners.md))
