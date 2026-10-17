# Wrangler config with a previews block

## Context
Cloudflare builds every pushed branch. Production (`main`) deploys fine, but other branches run `npx wrangler preview`, which fails with "Your Wrangler configuration is missing a `previews` block". The repo has no Wrangler config at all, so every PR shows a failing "Workers Builds: app" check, even when `npm run build` passes (seen on PRs #1 and #2).

Production today, checked on https://app.build101-23.workers.dev: a Worker named `app` with no code, only static assets from the Vite build (`dist/`), and any unknown path returns `index.html` (`/some/deep/path` answers 200 HTML).

## Steps
1. Branch `chore/wrangler-previews` from `origin/main`. Save this plan.
2. Add `wrangler.jsonc` at the root that describes what production does today, plus an empty `previews` block ([Cloudflare docs](https://developers.cloudflare.com/workers/previews/configuration/#wrangler-configuration-file)):
   - `name`: `app`
   - `compatibility_date`: today. No Worker code, so it doesn't change behavior.
   - `assets`: `directory` `./dist`, `not_found_handling` `single-page-application`
   - `previews`: `{}`, since there are no vars or bindings
3. Add `.wrangler/` to `.gitignore`.
4. Verify locally: `npm run build`, then `npx wrangler deploy --dry-run` to check that Wrangler accepts the config and finds the assets, with no upload.
5. Docs step: in `docs/development.md` → Deploy, say that each branch gets a Preview URL from Cloudflare, and that sign-in on a Preview needs its URL in Supabase's redirect URLs. No ADR: this completes [ADR 0005](../adr/0005-cloudflare-workers.md) and decides nothing new.
6. Commit, push, and open a PR to `main`. Its own Cloudflare check is the real test: it should pass and print a Preview URL.

## Verification
- The dry run succeeds and lists the `dist/` assets.
- The PR's "Workers Builds: app" check passes.
- After merge, production still serves `/` and deep paths as before.
