# Plan: restart the v4 deck from zero, and run it from the repo

Date: 2026-10-18
Status: applied (restart checked from the HUD, the presenter view, Shift+R and a cancelled prompt; `npm run pitch` serves the deck and blocks paths outside `pitch/`; over plain `file://` in Chrome the deck and presenter view sync both ways and restart reaches both)

## Context

The v4 deck ([v4 plan](2026-10-18-pitch-deck-v4-visual-polish.md) and follow-ups) lives in `C:\prompt-lab\output\` and is built from a template in a session scratchpad, which other machines don't have. The user wants to:
- restart the presentation from zero before pitching (cover, nothing revealed, both timers at 00:00);
- commit it so anyone can run it from a clone.

The repo already has `pitch/VIVERI_presentacion_v3.html` (commit 0644afb).

## Approach

- **Restart.** A `restart()` in the deck: back to the cover with no fragments, both timers at zero and paused, synced to the presenter view. Reachable from a "Reiniciar" button in the bottom controls and in the presenter view (each asks for confirmation, so a stray click mid-pitch doesn't wipe the timers), and Shift+R on the keyboard (deliberate enough to skip the prompt). Listed in the help panel. `Home` keeps going to the cover without touching the timers; `R` keeps resetting only the timers.
- **In the repo.** `pitch/VIVERI_presentacion_v4.html` is the built, self-contained file (fonts embedded, no network, no build step) and becomes the deck's source from now on: later edits go straight into it. It runs by opening the file in Chrome or Edge.
- **Served.** `pitch/serve.mjs`, a dependency-free Node static server, and `npm run pitch`, which serves `pitch/` on `http://localhost:8080`. Serving is the reliable way to get the presenter view in sync in every browser; the file also syncs over `file://` through `localStorage`, which the script checks.
- v3 stays in `pitch/` as it is.

## Steps

1. Add restart to the template, rebuild, and copy the build to `pitch/VIVERI_presentacion_v4.html`.
2. Add `pitch/serve.mjs` and the `pitch` npm script.
3. Verify: restart from the HUD, the presenter view and Shift+R; `npm run pitch` serves the deck; over `file://`, two windows (deck and presenter) stay in sync (Chrome headless over the DevTools protocol).
4. Docs: how to run it in [development.md](../development.md); [pitch.md](../notes/pitch.md) points to the repo file; this plan to applied.
