# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-10-17

## Context
We want documentation that stays organized and does not decay into many half-alive markdown files.

## Decision
Each kind of doc has one home:
- `README.md`: very short app description.
- `AGENTS.md`: very short rules for coding agents (`CLAUDE.md` only imports it).
- `docs/*.md` (product, architecture, development): living docs that describe the current state and are updated in the same change as the code.
- `docs/adr/`: append-only decision records (this file).
- `docs/plans/`: LLM coding plans, saved before implementing and not edited afterwards.
- `docs/notes/`: todos, brainstorms and other working docs.

All documentation is in English. Every plan includes a step to update living docs and add ADRs.

## Consequences
- What is true now lives in the living docs, and why it was decided lives in ADRs.
- Plans and ADRs add a little overhead to each change.
