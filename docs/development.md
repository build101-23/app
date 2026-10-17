# Development

Living doc: how to work on the app *now*.

## Setup

1. Install [Homebrew](https://brew.sh), then Node: `brew install node`.
2. Ask to be invited to the Supabase organization (Organization settings → Team). There is one hosted project, and no local Docker setup.
3. Create `.env.local` with the [variables below](#environment-variables), filled in from the Supabase dashboard (Project Settings → API Keys).

The project's sign-in email template (Authentication → Email templates → Magic link) must contain `{{ .Token }}`, because the app signs in with a 6-digit code instead of a link.

## Commands

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
