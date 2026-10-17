# Development

Living doc: how to work on the app *now*.

## Setup

1. Install [Homebrew](https://brew.sh), then Node: `brew install node`.
2. Ask to be invited to the Supabase organization (Organization settings → Team). There is one hosted project, and no local Docker setup.
3. `npm install`.
4. Copy `.env.example` to `.env.local` and fill in the [variables below](#environment-variables) from the Supabase dashboard (Project Settings → API Keys).

Sign-in uses Supabase's default magic link email. The link only sends you back to URLs listed under Authentication → URL Configuration → Redirect URLs, so that list must include `http://localhost:5173`. Supabase's built-in email sender is rate-limited and meant for testing. The pilot needs our own SMTP ([milestones](notes/milestones.md)).

## Commands

| Command | What |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Lint with oxlint |

## Environment variables

| Name | Where | What |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env.local` | Project URL, e.g. `https://<ref>.supabase.co` (without `/rest/v1/`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Publishable key (`sb_publishable_...`) |
| `SUPABASE_DB_PASSWORD` | `.env.local`, only if you run migrations | Database password, from the shared vault |

### Secrets

- The URL and the publishable key are public. Row-level security protects the data, not the key.
- The database password lives in the team's shared password vault. Never commit it.
- The secret key and the Anthropic API key are stored only with `supabase secrets set`, so Edge Functions can read them. They never go in `.env.local` or the repo.
- Every table enables row-level security in its migration, with an owner policy (`auth.uid() = user_id`). Check Database → Advisors → Security after each milestone.

## Testing

## Deploy
