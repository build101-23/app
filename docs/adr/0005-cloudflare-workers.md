# 0005. Host the web app on Cloudflare Workers

- Status: Accepted
- Date: 2026-10-17

## Context
Supabase is already hosted. The web app ran only on our laptops, and teammates and testers need a URL to try each milestone on their phones. The app is a static Vite build. Options considered:
- Cloudflare (a Worker serving static files, or Pages), Vercel or Netlify: free, connected to GitHub, deploy on every push.
- A Tenki sandbox VM, using our Tenki credits: built for throwaway agent workloads, with preview URLs meant for development. We'd also have to self-host Supabase there, which puts user and health data in a VM designed to be discarded.

## Decision
Host the static build on a Cloudflare Worker connected to the GitHub repo, so every push to `main` deploys. Supabase stays on its hosted plan. The Tenki credits go to CI instead.

## Consequences
- Free, with HTTPS and a stable URL. No servers to run.
- The public Supabase values are committed in `.env`, because Cloudflare builds from the repo.
- Every deployed URL must be listed in Supabase's redirect URLs, or sign-in links won't come back to it.
