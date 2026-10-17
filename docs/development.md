# Development

Living doc: how to work on the app *now*.

## Setup

1. Install [Homebrew](https://brew.sh), then Node: `brew install node`.
2. Ask to be invited to the Supabase organization (Organization settings → Team). There is one hosted project, and no local Docker setup.
3. `npm install`. The public Supabase values are already in the committed `.env`, so there's nothing to fill in.
4. Only if you change the database or Edge Functions: `npx supabase login`, then `npx supabase link --project-ref eqqrqkgabfjhfynsuwzj` (the project's ID, as in its URL). `link` asks for the database password from the shared vault.

Sign-in uses Supabase's default magic link email. The link only sends you back to URLs listed under Authentication → URL Configuration → Redirect URLs, so that list must include `http://localhost:5173/**` and the [deployed URL](#deploy). Supabase's built-in email sender is rate-limited and meant for testing. The pilot needs our own SMTP ([milestones](notes/milestones.md)).

## Commands

| Command | What |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run dev:fixture` | Dev server at http://localhost:5199 with synthetic data instead of Supabase ([Testing](#testing)) |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Lint with oxlint |
| `npx supabase migration new <name>` | Create an empty migration in `supabase/migrations/` |
| `npx supabase db push` | Apply new migrations to the hosted database (asks for the database password) |
| `npx supabase functions deploy chat` | Deploy the `chat` Edge Function. Functions aren't deployed by pushing to `main`. |

`db push` connects straight to Postgres on ports 5432 and 6543, which some Wi-Fi networks block. If it hangs at "Initialising login role...", switch to another network (a phone hotspot works).

There's no local Supabase (that needs Docker), so Edge Functions are tested against the hosted project after deploying. Their logs are in the dashboard under Edge Functions → chat → Logs.

## Environment variables

| Name | Where | What |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env` (committed) | Project URL, e.g. `https://<ref>.supabase.co` (without `/rest/v1/`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` (committed) | Publishable key (`sb_publishable_...`) |
| `SUPABASE_DB_PASSWORD` | `.env.local`, only if you run migrations | Database password, from the shared vault |

Vite reads `.env`, then `.env.local` (gitignored), which overrides it.

### Secrets

- The URL and the publishable key are public: they end up in the JavaScript every visitor downloads, so they're committed. Row-level security protects the data, not the key.
- The database password lives in the team's shared password vault. Never commit it.
- The secret key and the Anthropic API key (`ANTHROPIC_API_KEY`, created inside an Anthropic Console workspace: org-level keys are rejected without a workspace header) are stored only as Supabase Edge Function secrets (dashboard → Edge Functions → Secrets, or `supabase secrets set`), so Edge Functions can read them. They never go in `.env.local` or the repo.
- Every table enables row-level security in its migration, with an owner policy (`auth.uid() = user_id`). Check Database → Advisors → Security after each milestone.

## Testing

### Screens with synthetic data
`npm run dev:fixture` runs the app with `src/dev/fixture.ts` in place of the Supabase client (`vite.config.ts` swaps it in fixture mode only; the production build never includes it). You're signed in as `persona@ejemplo.com` with a sample conversation and profile, so every screen can be checked without an account. Pick states with query parameters, combined freely:

| Parameter | Values (default first) | What it shows |
| --- | --- | --- |
| `auth` | `in`, `out` | Signed in, or the sign-in screen |
| `otp` | `ok`, `error`, `slow` | Sign-in link sent, refused (rate limit), or slow |
| `chat` | `long`, `empty`, `error` | Sample conversation, no messages, or a load error |
| `reply` | `ok`, `error`, `slow`, `trickle` | The streamed reply to a sent message. `slow` waits 3 s for the first words; `trickle` streams one chunk every 600 ms, to see the status line |
| `profile` | `full`, `empty`, `error` | Saved profile, nothing saved, or a load error |
| `loading` | `session`, `data` | Stuck on the splash, or on the chat and profile skeletons |
| `safe` | `iphone` | Simulated 47 px top and 34 px bottom safe areas |

Example: http://localhost:5199/?chat=empty&reply=slow. Check new screens at 360 px, 390 px and 1280 px wide, in light and dark ([design.md](design.md)). Anything that scrolls under the glass dock also needs its bottom checked, so that nothing hides under the dock.

## Deploy

- The web app is a Cloudflare Worker serving the static build ([ADR 0005](adr/0005-cloudflare-workers.md)), live at https://app.build101-23.workers.dev.
- Every push to `main` builds (`npm run build`) and deploys automatically. Build logs are in the Cloudflare dashboard under Workers & Pages → app → Builds.
- In Supabase, under Authentication → URL Configuration, the Site URL is the deployed URL and the Redirect URLs include `https://app.build101-23.workers.dev/**`.
