# Development

Living doc: how to work on the app *now*.

## Setup

1. Install [Homebrew](https://brew.sh), then Node: `brew install node`.
2. Ask to be invited to the Supabase organization (Organization settings → Team). There is one hosted project, and no local Docker setup.
3. `npm install`. The public Supabase values are already in the committed `.env`, so there's nothing to fill in.
4. Only if you change the database or Edge Functions: `npx supabase login`, then `npx supabase link --project-ref eqqrqkgabfjhfynsuwzj` (the project's ID, as in its URL). `link` asks for the database password from the shared vault.
5. Only if you run the [price scraper](#price-scraper): `python3 -m venv scraper/.venv && scraper/.venv/bin/pip install -r scraper/requirements.txt` (Python 3.13).

Sign-in uses Supabase's default magic link email. The link only sends you back to URLs listed under Authentication → URL Configuration → Redirect URLs, so that list must include `http://localhost:5173/**` and the [deployed URL](#deploy). Supabase's built-in email sender is rate-limited and meant for testing. The pilot needs our own SMTP ([milestones](notes/milestones.md)).

## Commands

| Command | What |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Lint with oxlint; warnings fail it too |
| `npm test` | Run the tests (Node's test runner) |
| `npx supabase migration new <name>` | Create an empty migration in `supabase/migrations/` |
| `npx supabase db push` | Apply new migrations to the hosted database (asks for the database password) |
| `npx supabase functions deploy chat` | Deploy the `chat` Edge Function. Functions aren't deployed by pushing to `main`. |
| `deno check --no-lock --node-modules-dir=none supabase/functions/chat/index.ts` | Type-check the `chat` function (Deno 2), which `npm run build` doesn't cover |
| `scraper/.venv/bin/python -m scraper` | Read supermarket prices into Supabase, 25 minutes at most ([below](#price-scraper)) |

When a migration takes away a write that the deployed function still makes with the user's token, deploy the function first, then `db push`. The other way round, the function breaks until it's deployed.

`db push` connects straight to Postgres on ports 5432 and 6543, which some Wi-Fi networks block. If it hangs at "Initialising login role...", switch to another network (a phone hotspot works).

There's no local Supabase (that needs Docker), so Edge Functions are tested against the hosted project after deploying. Their logs are in the dashboard under Edge Functions → chat → Logs. Each Claude call in a chat turn logs one JSON line with its round, the milliseconds since the turn started, its token usage and the tools it called: that's where a turn's time and cost show.

## Environment variables

| Name | Where | What |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env` (committed) | Project URL, e.g. `https://<ref>.supabase.co` (without `/rest/v1/`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` (committed) | Publishable key (`sb_publishable_...`) |
| `SUPABASE_DB_PASSWORD` | `.env.local`, only if you run migrations | Database password, from the shared vault |
| `SUPABASE_SECRET_KEY` | `scraper/.env.local`, only if you run the scraper | The scraper's own secret key ([below](#secrets)). The project URL comes from `.env`. |

Vite reads `.env`, then `.env.local` (gitignored), which overrides it.

### Secrets

- The URL and the publishable key are public: they end up in the JavaScript every visitor downloads, so they're committed. Row-level security protects the data, not the key.
- The database password lives in the team's shared password vault. Never commit it.
- The secret key and the Anthropic API key (`ANTHROPIC_API_KEY`, created inside an Anthropic Console workspace: org-level keys are rejected without a workspace header) are stored only as Supabase Edge Function secrets (dashboard → Edge Functions → Secrets, or `supabase secrets set`), so Edge Functions can read them. They never go in `.env.local` or the repo. Supabase also gives every Edge Function `SUPABASE_SERVICE_ROLE_KEY`, which `chat` writes with.
- The one exception is the price scraper's own secret key, named `scraper` (dashboard → Project Settings → API Keys → Secret keys). Like any secret key it acts as `service_role`; it's a separate key only so it can be revoked on its own. It lives only in `scraper/.env.local` (gitignored) on the machine that runs the scraper.
- Every table enables row-level security in its migration, with an owner policy (`auth.uid() = user_id`) that only allows `select`, unless the browser has to write that table. Today the browser writes only `conversations` and `menus.have` (through a column grant), and the profile's `show_numbers` through the `set_show_numbers` function ([ADR 0021](adr/0021-numbers-switch-in-the-profile.md)). Edge Functions write everything else with the service-role key ([ADR 0014](adr/0014-client-reads-chat-function-writes.md)). The price catalog is the exception: every signed-in user reads all of it, and only the scraper writes it ([ADR 0016](adr/0016-price-catalog-one-row-per-product-per-chain.md)). Check Database → Advisors → Security after each milestone.

## Testing

- `npm test` runs Node's built-in test runner on `supabase/functions/_shared/*.test.ts`. That code is plain TS, so it runs without Deno.
- Node only strips types from the tests, so `npm run build` type-checks them (`tsconfig.node.json` includes `_shared`).
- CI ([workflow](../.github/workflows/ci.yml), [ADR 0020](adr/0020-ci-on-tenki-runners.md)) runs lint, build and tests, and the scraper's tests, on pull requests and on pushes to `main`, on Tenki runners, and skips pull requests from forks. It uses Node 24, like Cloudflare; your local Node may be newer. It doesn't block Cloudflare deploys.
- The `chat` function itself has no tests: keep its logic in `_shared`, type-check it with `deno check` and try it against the hosted project after deploying.
- Scraper: `scraper/.venv/bin/python -m unittest discover -s scraper/tests -t .`. Hand-written fixtures, no network.

## Deploy

- The web app is a Cloudflare Worker serving the static build ([ADR 0005](adr/0005-cloudflare-workers.md)), live at https://app.build101-23.workers.dev.
- Every push to `main` builds (`npm run build`) and deploys automatically. Build logs are in the Cloudflare dashboard under Workers & Pages → app → Builds.
- Every other pushed branch builds too and gets its own Preview URL (`npx wrangler preview`); the URL is in that build's log. The Worker's settings live in `wrangler.jsonc`; Preview-only settings go in its `previews` block.
- Signing in on a Preview only works if its URL is in Supabase's Redirect URLs (below).
- In Supabase, under Authentication → URL Configuration, the Site URL is the deployed URL and the Redirect URLs include `https://app.build101-23.workers.dev/**`.

## Price scraper

How it works and why: [ADR 0015](adr/0015-price-scraper-python-job-with-time-budget.md) and [ADR 0018](adr/0018-gdu-listings-and-food-pages.md). Reading rules: [ADR 0008](adr/0008-how-we-read-supermarket-sites.md).

- `scraper/.venv/bin/python -m scraper` reads all four chains for 25 minutes at most and saves as it goes. Ctrl-C stops it and keeps what it read.
- Run it with `--stores disco,geant,tata` at least weekly, and before a demo: the chat's product search only sees products read within 14 days of their store's newest read, and saved menus price their products as the last run read them ([ADR 0024](adr/0024-agent-builds-the-menu-from-real-products.md)).
- Narrow a run with `--minutes`, `--stores devoto,tata`, `--limit N` (at most N pages per chain and phase) and `--phases` (`categories,brands,food`; `brands` needs `categories`). `--phases food` tops up food products without reading the listings again.
- `--dry-run` writes NDJSON to `scraper/data/out/` instead of Supabase, and needs no key.
- The GDU sitemap is cached for 24 hours in `scraper/data/cache/`. `--refresh-sitemap` reads it again.
- Every run leaves one `scrape_runs` row per chain: `status` (`done`, `interrupted`, `blocked`, `failed`), `price_context` and counters in `stats`.
- A `blocked` chain stopped on its own, without retrying. When it's Devoto, Géant or Disco, the other two stop as well (`interrupted`): they share one platform. Read [ADR 0008](adr/0008-how-we-read-supermarket-sites.md) before trying again. Wait a while, then check with a tiny run (`--stores devoto --limit 1 --dry-run`, two requests); Devoto's first block lasted under 11 minutes.

## Spikes

- Supermarket prices (`spikes/supermarket-prices/`, Python 3.13, not part of the app): see [price-sources-research.md](notes/price-sources-research.md#running-the-spike).
- Cart handoff (`spikes/cart-handoff/`, Python 3.13 + Playwright, not part of the app): see [cart-handoff-feasibility.md](notes/cart-handoff-feasibility.md#running-the-spike).
