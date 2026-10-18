# Plan: publish the pitch deck at /pitch/ on the app's Worker

Date: 2026-10-18
Status: applied (checked on the branch Preview, `https://pitch-deck-v4-app.build101-23.workers.dev/pitch/`: the same deck as `pitch/` apart from line endings, `/pitch` redirects to `/pitch/`, 12 slides with brand fonts and no errors, presenter view in sync both ways, Reiniciar resets both windows)

## Context

The deck runs locally ([restart and repo plan](2026-10-18-pitch-deck-restart-and-repo.md)). The user wants it at a URL like the app's, so on pitch day any computer only needs a browser. The app is a Cloudflare Worker serving `dist/` ([ADR 0005](../adr/0005-cloudflare-workers.md)); every push to `main` deploys, and other branches get a Preview.

The user accepted that the URL is public (anyone with the link can open it; the app doesn't link to it).

## Approach

- A small Vite plugin in `vite.config.ts` emits `pitch/VIVERI_presentacion_v4.html` as `dist/pitch/index.html` during `npm run build`. The deck keeps one copy, in `pitch/`; nothing is duplicated in `public/`.
- Cloudflare serves it at `/pitch/` (and redirects `/pitch` there, since a real file wins over the single-page fallback). The deck is self-contained, so no other asset is needed.
- Same behavior as local: presenter view (`/pitch/?presenter=1`), timers and Reiniciar sync through BroadcastChannel and `localStorage`, which work on any https origin.

## Steps

1. Plugin in `vite.config.ts`; `npm run build`; check `dist/pitch/index.html` is identical to the source; `npm run lint`.
2. Docs: [development.md](../development.md#pitch-deck) gets the URL; [pitch.md](../notes/pitch.md) too.
3. Commit and push to the PR #32 branch; on its Cloudflare Preview, open `/pitch/`, step through, open the presenter view and restart.
4. This plan to applied.
